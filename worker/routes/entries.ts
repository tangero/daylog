import { Hono } from 'hono'
import { z } from 'zod'
import { escapeLikePattern, paginationSchema } from '../lib/validation'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

interface JWTPayload {
  sub: string
  email: string
}

// Zod schémata pro validaci
const entrySchema = z.object({
  rawText: z.string().min(1, 'Text záznamu je povinný').max(5000, 'Text je příliš dlouhý'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neplatný formát data (očekáváno YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Neplatný formát času').nullable(),
  durationMinutes: z.number().int().min(0).max(1440), // max 24 hodin
  description: z.string().max(5000, 'Popis je příliš dlouhý'),
  hashtags: z.array(z.string().max(50)).max(20, 'Maximálně 20 hashtagů'),
  clients: z.array(z.string().max(100)).max(10, 'Maximálně 10 klientů'),
})

type EntryInput = z.infer<typeof entrySchema>

export const entriesRoutes = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>()

function generateId(): string {
  return crypto.randomUUID()
}

// Získat záznamy - optimalizováno pomocí GROUP_CONCAT (1 query místo N+1)
entriesRoutes.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub
  const filterType = c.req.query('filterType')
  const filterValue = c.req.query('filterValue')

  const paginationResult = paginationSchema.safeParse({
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
  })
  const { limit, offset } = paginationResult.success 
    ? paginationResult.data 
    : { limit: 50, offset: 0 }

  // Základní query s agregovanými tagy a klienty
  let query = `
    SELECT
      e.id,
      e.raw_text as rawText,
      e.parsed_date as parsedDate,
      e.parsed_time as parsedTime,
      e.duration_minutes as durationMinutes,
      e.description,
      e.created_at as createdAt,
      (
        SELECT GROUP_CONCAT(t.name, ',')
        FROM entry_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.entry_id = e.id
      ) as tagsStr,
      (
        SELECT GROUP_CONCAT(cl.name, ',')
        FROM entry_clients ec
        JOIN clients cl ON ec.client_id = cl.id
        WHERE ec.entry_id = e.id
      ) as clientsStr
    FROM entries e
    WHERE e.user_id = ?
  `
  const params: string[] = [userId]

  if (filterType === 'tag' && filterValue) {
    query += `
      AND e.id IN (
        SELECT et.entry_id FROM entry_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE t.name = ? AND t.user_id = ?
      )
    `
    params.push(filterValue, userId)
  } else if (filterType === 'client' && filterValue) {
    query += `
      AND e.id IN (
        SELECT ec.entry_id FROM entry_clients ec
        JOIN clients cl ON ec.client_id = cl.id
        WHERE cl.name = ? AND cl.user_id = ?
      )
    `
    params.push(filterValue, userId)
  } else if (filterType === 'search' && filterValue) {
    query += ` AND e.raw_text LIKE ? ESCAPE '\\'`
    params.push(`%${escapeLikePattern(filterValue)}%`)
  } else if (filterType === 'date' && filterValue) {
    query += ` AND e.parsed_date = ?`
    params.push(filterValue)
  }

  // Spočítat celkový počet (pro paginaci)
  let countQuery = 'SELECT COUNT(*) as total FROM entries e WHERE e.user_id = ?'
  const countParams: string[] = [userId]

  if (filterType === 'tag' && filterValue) {
    countQuery += ` AND e.id IN (SELECT et.entry_id FROM entry_tags et JOIN tags t ON et.tag_id = t.id WHERE t.name = ? AND t.user_id = ?)`
    countParams.push(filterValue, userId)
  } else if (filterType === 'client' && filterValue) {
    countQuery += ` AND e.id IN (SELECT ec.entry_id FROM entry_clients ec JOIN clients cl ON ec.client_id = cl.id WHERE cl.name = ? AND cl.user_id = ?)`
    countParams.push(filterValue, userId)
  } else if (filterType === 'search' && filterValue) {
    countQuery += ` AND e.raw_text LIKE ? ESCAPE '\\'`
    countParams.push(`%${escapeLikePattern(filterValue)}%`)
  } else if (filterType === 'date' && filterValue) {
    countQuery += ` AND e.parsed_date = ?`
    countParams.push(filterValue)
  }

  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>()
  const total = countResult?.total || 0

  query += ` ORDER BY e.parsed_date DESC, e.parsed_time DESC, e.created_at DESC LIMIT ? OFFSET ?`
  params.push(String(limit), String(offset))

  const entries = await c.env.DB.prepare(query).bind(...params).all()

  // Transformovat výsledky - rozdělit tagsStr a clientsStr na pole
  const results = (entries.results || []).map((entry: Record<string, unknown>) => {
    const tagsStr = entry.tagsStr as string | null
    const clientsStr = entry.clientsStr as string | null

    return {
      id: entry.id,
      rawText: entry.rawText,
      parsedDate: entry.parsedDate,
      parsedTime: entry.parsedTime,
      durationMinutes: entry.durationMinutes,
      description: entry.description,
      createdAt: entry.createdAt,
      hashtags: tagsStr ? tagsStr.split(',') : [],
      clients: clientsStr ? clientsStr.split(',') : [],
    }
  })

  return c.json({
    data: results,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + results.length < total
    }
  })
})

// Vytvořit záznam - optimalizováno s batch operacemi pro atomicitu
entriesRoutes.post('/', async (c) => {
  const userId = c.get('jwtPayload').sub

  // Validace vstupu
  const rawBody = await c.req.json()
  const parseResult = entrySchema.safeParse(rawBody)

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(e => e.message).join(', ')
    return c.json({ error: `Neplatná data: ${errors}` }, 400)
  }

  const body = parseResult.data
  const entryId = generateId()

  // Připravit batch operace
  const statements: D1PreparedStatement[] = []

  // 1. Vložit záznam
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO entries (id, user_id, raw_text, parsed_date, parsed_time, duration_minutes, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(entryId, userId, body.rawText, body.date, body.time, body.durationMinutes, body.description)
  )

  // 2. Načíst existující tagy najednou (pokud nějaké jsou)
  const tagIds: Map<string, string> = new Map()
  if (body.hashtags.length > 0) {
    const placeholders = body.hashtags.map(() => '?').join(',')
    const existingTags = await c.env.DB.prepare(
      `SELECT id, name FROM tags WHERE user_id = ? AND name IN (${placeholders})`
    ).bind(userId, ...body.hashtags).all<{ id: string; name: string }>()

    for (const tag of existingTags.results || []) {
      tagIds.set(tag.name, tag.id)
    }
  }

  // Vytvořit chybějící tagy a propojení
  for (const tagName of body.hashtags) {
    let tagId = tagIds.get(tagName)
    if (!tagId) {
      tagId = generateId()
      statements.push(
        c.env.DB.prepare('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)').bind(tagId, userId, tagName)
      )
    }
    statements.push(
      c.env.DB.prepare('INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)').bind(entryId, tagId)
    )
  }

  // 3. Načíst existující klienty najednou (pokud nějací jsou)
  const clientIds: Map<string, string> = new Map()
  if (body.clients.length > 0) {
    const placeholders = body.clients.map(() => '?').join(',')
    const existingClients = await c.env.DB.prepare(
      `SELECT id, name FROM clients WHERE user_id = ? AND name IN (${placeholders})`
    ).bind(userId, ...body.clients).all<{ id: string; name: string }>()

    for (const client of existingClients.results || []) {
      clientIds.set(client.name, client.id)
    }
  }

  // Vytvořit chybějící klienty a propojení
  for (const clientName of body.clients) {
    let clientId = clientIds.get(clientName)
    if (!clientId) {
      clientId = generateId()
      statements.push(
        c.env.DB.prepare('INSERT INTO clients (id, user_id, name) VALUES (?, ?, ?)').bind(clientId, userId, clientName)
      )
    }
    statements.push(
      c.env.DB.prepare('INSERT INTO entry_clients (entry_id, client_id) VALUES (?, ?)').bind(entryId, clientId)
    )
  }

  // 4. Spustit vše atomicky
  await c.env.DB.batch(statements)

  return c.json({ id: entryId, success: true }, 201)
})

// Upravit záznam - optimalizováno s batch operacemi pro atomicitu
entriesRoutes.put('/:id', async (c) => {
  const userId = c.get('jwtPayload').sub
  const entryId = c.req.param('id')

  // Validace vstupu
  const rawBody = await c.req.json()
  const parseResult = entrySchema.safeParse(rawBody)

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(e => e.message).join(', ')
    return c.json({ error: `Neplatná data: ${errors}` }, 400)
  }

  const body = parseResult.data

  // Ověřit vlastnictví
  const entry = await c.env.DB.prepare(
    'SELECT id FROM entries WHERE id = ? AND user_id = ?'
  ).bind(entryId, userId).first()

  if (!entry) {
    return c.json({ error: 'Záznam nenalezen' }, 404)
  }

  // Připravit batch operace
  const statements: D1PreparedStatement[] = []

  // 1. Aktualizovat záznam
  statements.push(
    c.env.DB.prepare(`
      UPDATE entries SET
        raw_text = ?,
        parsed_date = ?,
        parsed_time = ?,
        duration_minutes = ?,
        description = ?
      WHERE id = ?
    `).bind(body.rawText, body.date, body.time, body.durationMinutes, body.description, entryId)
  )

  // 2. Smazat staré vazby
  statements.push(
    c.env.DB.prepare('DELETE FROM entry_tags WHERE entry_id = ?').bind(entryId)
  )
  statements.push(
    c.env.DB.prepare('DELETE FROM entry_clients WHERE entry_id = ?').bind(entryId)
  )

  // 3. Načíst existující tagy najednou (pokud nějaké jsou)
  const tagIds: Map<string, string> = new Map()
  if (body.hashtags.length > 0) {
    const placeholders = body.hashtags.map(() => '?').join(',')
    const existingTags = await c.env.DB.prepare(
      `SELECT id, name FROM tags WHERE user_id = ? AND name IN (${placeholders})`
    ).bind(userId, ...body.hashtags).all<{ id: string; name: string }>()

    for (const tag of existingTags.results || []) {
      tagIds.set(tag.name, tag.id)
    }
  }

  // Vytvořit chybějící tagy a propojení
  for (const tagName of body.hashtags) {
    let tagId = tagIds.get(tagName)
    if (!tagId) {
      tagId = generateId()
      statements.push(
        c.env.DB.prepare('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)').bind(tagId, userId, tagName)
      )
    }
    statements.push(
      c.env.DB.prepare('INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)').bind(entryId, tagId)
    )
  }

  // 4. Načíst existující klienty najednou (pokud nějací jsou)
  const clientIds: Map<string, string> = new Map()
  if (body.clients.length > 0) {
    const placeholders = body.clients.map(() => '?').join(',')
    const existingClients = await c.env.DB.prepare(
      `SELECT id, name FROM clients WHERE user_id = ? AND name IN (${placeholders})`
    ).bind(userId, ...body.clients).all<{ id: string; name: string }>()

    for (const client of existingClients.results || []) {
      clientIds.set(client.name, client.id)
    }
  }

  // Vytvořit chybějící klienty a propojení
  for (const clientName of body.clients) {
    let clientId = clientIds.get(clientName)
    if (!clientId) {
      clientId = generateId()
      statements.push(
        c.env.DB.prepare('INSERT INTO clients (id, user_id, name) VALUES (?, ?, ?)').bind(clientId, userId, clientName)
      )
    }
    statements.push(
      c.env.DB.prepare('INSERT INTO entry_clients (entry_id, client_id) VALUES (?, ?)').bind(entryId, clientId)
    )
  }

  // 5. Spustit vše atomicky
  await c.env.DB.batch(statements)

  return c.json({ success: true })
})

// Smazat záznam - vazby se smažou automaticky díky ON DELETE CASCADE
entriesRoutes.delete('/:id', async (c) => {
  const userId = c.get('jwtPayload').sub
  const entryId = c.req.param('id')

  // Smazat záznam (ověří vlastnictví v podmínce WHERE)
  // Vazby v entry_tags a entry_clients se smažou automaticky díky ON DELETE CASCADE
  const result = await c.env.DB.prepare(
    'DELETE FROM entries WHERE id = ? AND user_id = ?'
  ).bind(entryId, userId).run()

  if (result.meta.changes === 0) {
    return c.json({ error: 'Záznam nenalezen' }, 404)
  }

  return c.json({ success: true })
})
