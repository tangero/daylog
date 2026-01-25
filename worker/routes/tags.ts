import { Hono } from 'hono'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

interface JWTPayload {
  sub: string
  email: string
}

export const tagsRoutes = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>()

// Získat všechny tagy s počtem použití
tagsRoutes.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub

  const result = await c.env.DB.prepare(`
    SELECT t.name, COUNT(et.entry_id) as count
    FROM tags t
    LEFT JOIN entry_tags et ON t.id = et.tag_id
    WHERE t.user_id = ?
    GROUP BY t.id, t.name
    ORDER BY count DESC, t.name ASC
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
