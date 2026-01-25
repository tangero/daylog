import { Hono } from 'hono'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

interface JWTPayload {
  sub: string
  email: string
}

export const clientsRoutes = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>()

// Získat všechny klienty se statistikami
clientsRoutes.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub

  const result = await c.env.DB.prepare(`
    SELECT
      cl.id,
      cl.name,
      cl.hourly_rate as hourlyRate,
      COUNT(ec.entry_id) as count,
      COALESCE(SUM(e.duration_minutes), 0) as totalMinutes,
      SUM(CASE WHEN e.duration_minutes = 0 THEN 1 ELSE 0 END) as entriesWithoutDuration
    FROM clients cl
    LEFT JOIN entry_clients ec ON cl.id = ec.client_id
    LEFT JOIN entries e ON ec.entry_id = e.id
    WHERE cl.user_id = ?
    GROUP BY cl.id, cl.name, cl.hourly_rate
    ORDER BY count DESC, cl.name ASC
  `).bind(userId).all()

  const results = result.results || []

  // Generovat ETag z dat
  const dataStr = JSON.stringify(results)
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataStr))
  const etag = Array.from(new Uint8Array(hashBuffer)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')

  // Zkontrolovat If-None-Match
  const ifNoneMatch = c.req.header('If-None-Match')
  if (ifNoneMatch === etag) {
    return c.body(null, 304)
  }

  c.header('ETag', etag)
  c.header('Cache-Control', 'private, max-age=60')
  return c.json(results)
})

// Aktualizovat klienta (hodinová sazba)
clientsRoutes.put('/:name', async (c) => {
  const userId = c.get('jwtPayload').sub
  const clientName = decodeURIComponent(c.req.param('name'))
  const body = await c.req.json<{ hourlyRate?: number }>()

  // Najít klienta
  const client = await c.env.DB.prepare(
    'SELECT id FROM clients WHERE user_id = ? AND name = ?'
  ).bind(userId, clientName).first<{ id: string }>()

  if (!client) {
    return c.json({ error: 'Klient nenalezen' }, 404)
  }

  // Aktualizovat hodinovou sazbu
  if (body.hourlyRate !== undefined) {
    await c.env.DB.prepare(
      'UPDATE clients SET hourly_rate = ? WHERE id = ?'
    ).bind(body.hourlyRate, client.id).run()
  }

  return c.json({ success: true })
})
