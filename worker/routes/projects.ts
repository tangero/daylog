import { Hono } from 'hono'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

interface JWTPayload {
  sub: string
  email: string
}

export const projectsRoutes = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>()

function generateId(): string {
  return crypto.randomUUID()
}

// Get project by tag name
projectsRoutes.get('/:tagName', async (c) => {
  const userId = c.get('jwtPayload').sub
  const tagName = c.req.param('tagName')

  const project = await c.env.DB.prepare(
    'SELECT id, tag_name as tagName, name, description, created_at as createdAt, updated_at as updatedAt FROM projects WHERE user_id = ? AND tag_name = ?'
  ).bind(userId, tagName).first()

  if (!project) {
    return c.json({ tagName, name: null, description: null })
  }

  return c.json(project)
})

// Create or update project
projectsRoutes.put('/:tagName', async (c) => {
  const userId = c.get('jwtPayload').sub
  const tagName = c.req.param('tagName')
  const { name, description } = await c.req.json<{ name: string | null; description: string | null }>()

  // Check if project exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM projects WHERE user_id = ? AND tag_name = ?'
  ).bind(userId, tagName).first()

  if (existing) {
    // Update
    await c.env.DB.prepare(
      'UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND tag_name = ?'
    ).bind(name, description, userId, tagName).run()
  } else {
    // Create
    const id = generateId()
    await c.env.DB.prepare(
      'INSERT INTO projects (id, user_id, tag_name, name, description) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, userId, tagName, name, description).run()
  }

  return c.json({ success: true })
})

// Delete project metadata (keeps the tag, just removes name/description)
projectsRoutes.delete('/:tagName', async (c) => {
  const userId = c.get('jwtPayload').sub
  const tagName = c.req.param('tagName')

  await c.env.DB.prepare(
    'DELETE FROM projects WHERE user_id = ? AND tag_name = ?'
  ).bind(userId, tagName).run()

  return c.json({ success: true })
})
