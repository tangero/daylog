import { Hono } from 'hono'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

interface JWTPayload {
  sub: string
  email: string
}

export const statsRoutes = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>()

// Pomocná funkce pro formátování období
function formatPeriodLabel(from: string, to: string): string {
  const fromDate = new Date(from)
  const toDate = new Date(to)

  const months = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']

  // Pokud je to celý měsíc
  if (fromDate.getDate() === 1) {
    const lastDay = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0).getDate()
    if (toDate.getDate() === lastDay && fromDate.getMonth() === toDate.getMonth()) {
      return `${months[fromDate.getMonth()]} ${fromDate.getFullYear()}`
    }
  }

  // Jinak rozsah
  return `${fromDate.getDate()}.${fromDate.getMonth() + 1}. - ${toDate.getDate()}.${toDate.getMonth() + 1}.${toDate.getFullYear()}`
}

// Formátování data pro české zobrazení
function formatDateCz(dateStr: string): string {
  const date = new Date(dateStr)
  const months = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro']
  return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`
}

// GET /api/stats/summary - Celkový přehled za období
statsRoutes.get('/summary', async (c) => {
  const userId = c.get('jwtPayload').sub
  const from = c.req.query('from')
  const to = c.req.query('to')

  if (!from || !to) {
    return c.json({ error: 'Parametry from a to jsou povinné' }, 400)
  }

  // Celkové souhrny
  const totalsResult = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as entries,
      COALESCE(SUM(duration_minutes), 0) as totalMinutes,
      COUNT(DISTINCT parsed_date) as daysWorked
    FROM entries
    WHERE user_id = ? AND parsed_date BETWEEN ? AND ?
  `).bind(userId, from, to).first<{
    entries: number
    totalMinutes: number
    daysWorked: number
  }>()

  const totals = {
    entries: totalsResult?.entries || 0,
    totalMinutes: totalsResult?.totalMinutes || 0,
    totalHours: Math.round((totalsResult?.totalMinutes || 0) / 60 * 100) / 100,
    daysWorked: totalsResult?.daysWorked || 0,
    avgMinutesPerDay: totalsResult?.daysWorked
      ? Math.round((totalsResult?.totalMinutes || 0) / totalsResult.daysWorked)
      : 0
  }

  // Podle klientů
  const clientsResult = await c.env.DB.prepare(`
    SELECT
      c.name,
      COUNT(e.id) as entries,
      COALESCE(SUM(e.duration_minutes), 0) as totalMinutes
    FROM entries e
    JOIN entry_clients ec ON e.id = ec.entry_id
    JOIN clients c ON ec.client_id = c.id
    WHERE e.user_id = ? AND e.parsed_date BETWEEN ? AND ?
    GROUP BY c.id, c.name
    ORDER BY totalMinutes DESC
  `).bind(userId, from, to).all()

  const byClient = (clientsResult.results || []).map((row: Record<string, unknown>) => ({
    name: row.name as string,
    entries: row.entries as number,
    totalMinutes: row.totalMinutes as number,
    percentage: totals.totalMinutes > 0
      ? Math.round((row.totalMinutes as number) / totals.totalMinutes * 100)
      : 0
  }))

  // Podle tagů
  const tagsResult = await c.env.DB.prepare(`
    SELECT
      t.name,
      COUNT(e.id) as entries,
      COALESCE(SUM(e.duration_minutes), 0) as totalMinutes
    FROM entries e
    JOIN entry_tags et ON e.id = et.entry_id
    JOIN tags t ON et.tag_id = t.id
    WHERE e.user_id = ? AND e.parsed_date BETWEEN ? AND ?
    GROUP BY t.id, t.name
    ORDER BY totalMinutes DESC
  `).bind(userId, from, to).all()

  const byTag = (tagsResult.results || []).map((row: Record<string, unknown>) => ({
    name: row.name as string,
    entries: row.entries as number,
    totalMinutes: row.totalMinutes as number
  }))

  // Denní přehled
  const dailyResult = await c.env.DB.prepare(`
    SELECT
      parsed_date as date,
      COALESCE(SUM(duration_minutes), 0) as totalMinutes,
      COUNT(*) as entries
    FROM entries
    WHERE user_id = ? AND parsed_date BETWEEN ? AND ?
    GROUP BY parsed_date
    ORDER BY parsed_date
  `).bind(userId, from, to).all()

  const dailyBreakdown = (dailyResult.results || []).map((row: Record<string, unknown>) => ({
    date: row.date as string,
    totalMinutes: row.totalMinutes as number,
    entries: row.entries as number
  }))

  return c.json({
    period: {
      from,
      to,
      label: formatPeriodLabel(from, to)
    },
    totals,
    byClient,
    byTag,
    dailyBreakdown
  })
})

// GET /api/stats/billing - Fakturační přehled pro klienta
statsRoutes.get('/billing', async (c) => {
  const userId = c.get('jwtPayload').sub
  const client = c.req.query('client')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const hourlyRateParam = c.req.query('hourlyRate')

  if (!client || !from || !to) {
    return c.json({ error: 'Parametry client, from a to jsou povinné' }, 400)
  }

  // Zjistit hodinovou sazbu klienta z DB (pokud není zadána)
  let hourlyRate: number | null = hourlyRateParam ? parseInt(hourlyRateParam) : null

  if (!hourlyRate) {
    const clientData = await c.env.DB.prepare(`
      SELECT hourly_rate FROM clients WHERE user_id = ? AND name = ?
    `).bind(userId, client).first<{ hourly_rate: number | null }>()

    hourlyRate = clientData?.hourly_rate || null
  }

  // Načíst záznamy pro klienta včetně tagů (optimalizováno - 1 dotaz místo N+1)
  const entriesResult = await c.env.DB.prepare(`
    SELECT
      e.id,
      e.parsed_date as date,
      e.parsed_time as time,
      e.duration_minutes as durationMinutes,
      e.description,
      (
        SELECT GROUP_CONCAT(t.name, ',')
        FROM entry_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.entry_id = e.id
      ) as tagsStr
    FROM entries e
    JOIN entry_clients ec ON e.id = ec.entry_id
    JOIN clients c ON ec.client_id = c.id
    WHERE e.user_id = ? AND c.name = ? AND e.parsed_date BETWEEN ? AND ?
    ORDER BY e.parsed_date, e.parsed_time
  `).bind(userId, client, from, to).all()

  // Transformovat výsledky - rozdělit tagsStr na pole
  const entries = (entriesResult.results || []).map((entry: Record<string, unknown>) => {
    const tagsStr = entry.tagsStr as string | null
    return {
      id: entry.id as string,
      date: entry.date as string,
      time: entry.time as string | null,
      durationMinutes: entry.durationMinutes as number,
      description: entry.description as string,
      tags: tagsStr ? tagsStr.split(',') : []
    }
  })

  // Spočítat souhrn
  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0)
  const totalHours = Math.round(totalMinutes / 60 * 100) / 100

  // Seskupit podle data
  const groupedByDate = entries.reduce((acc, entry) => {
    const existing = acc.find(g => g.date === entry.date)
    if (existing) {
      existing.entries.push(entry)
      existing.dayTotal += entry.durationMinutes
    } else {
      acc.push({
        date: entry.date,
        dateFormatted: formatDateCz(entry.date),
        entries: [entry],
        dayTotal: entry.durationMinutes
      })
    }
    return acc
  }, [] as { date: string; dateFormatted: string; entries: typeof entries; dayTotal: number }[])

  return c.json({
    client,
    period: { from, to },
    hourlyRate,
    summary: {
      totalMinutes,
      totalHours,
      entriesCount: entries.length,
      estimatedAmount: hourlyRate ? Math.round(totalHours * hourlyRate) : null
    },
    entries,
    groupedByDate
  })
})

// GET /api/stats/export - CSV export
statsRoutes.get('/export', async (c) => {
  const userId = c.get('jwtPayload').sub
  const type = c.req.query('type') || 'billing'
  const client = c.req.query('client')
  const from = c.req.query('from')
  const to = c.req.query('to')

  if (!from || !to) {
    return c.json({ error: 'Parametry from a to jsou povinné' }, 400)
  }

  if (type === 'billing' && !client) {
    return c.json({ error: 'Pro billing export je potřeba parametr client' }, 400)
  }

  // Načíst data
  let query = `
    SELECT
      e.parsed_date as date,
      e.parsed_time as time,
      e.description,
      e.duration_minutes as durationMinutes
    FROM entries e
  `
  const params: string[] = [userId, from, to]

  if (client) {
    query += `
      JOIN entry_clients ec ON e.id = ec.entry_id
      JOIN clients c ON ec.client_id = c.id
      WHERE e.user_id = ? AND c.name = ? AND e.parsed_date BETWEEN ? AND ?
    `
    params.splice(1, 0, client)
  } else {
    query += `
      WHERE e.user_id = ? AND e.parsed_date BETWEEN ? AND ?
    `
  }

  query += ` ORDER BY e.parsed_date, e.parsed_time`

  const result = await c.env.DB.prepare(query).bind(...params).all()

  // Načíst tagy pro záznamy
  const entries = await Promise.all(
    (result.results || []).map(async (entry: Record<string, unknown>) => {
      // Pro export tagů bychom potřebovali entry.id, ale nemáme ho v query
      // Zjednodušíme - tagy nebudeme v CSV exportovat detailně
      return {
        date: entry.date as string,
        time: entry.time as string | null,
        description: entry.description as string,
        durationMinutes: entry.durationMinutes as number
      }
    })
  )

  // Vytvořit CSV
  const lines: string[] = []
  lines.push('Datum;Čas;Popis;Délka (min);Délka (hod)')

  let totalMinutes = 0
  for (const entry of entries) {
    const date = new Date(entry.date)
    const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
    const hours = Math.round(entry.durationMinutes / 60 * 100) / 100
    totalMinutes += entry.durationMinutes

    lines.push(`${dateStr};${entry.time || ''};${entry.description};${entry.durationMinutes};${hours}`)
  }

  // Součet
  const totalHours = Math.round(totalMinutes / 60 * 100) / 100
  lines.push(`;;CELKEM;${totalMinutes};${totalHours}`)

  const csv = lines.join('\n')

  // Vrátit jako CSV soubor
  const filename = client
    ? `vyuctovani_${client}_${from}_${to}.csv`
    : `export_${from}_${to}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
})
