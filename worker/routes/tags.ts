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

  return c.json(result.results || [])
})
