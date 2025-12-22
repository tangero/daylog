import { Hono } from 'hono'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

interface JWTPayload {
  sub: string
  email: string
}

export const entriesRoutes = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>()

function generateId(): string {
  return crypto.randomUUID()
}

// Získat záznamy
entriesRoutes.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub
  const filterType = c.req.query('filterType')
  const filterValue = c.req.query('filterValue')

  let query = `
    SELECT
      e.id,
      e.raw_text as rawText,
      e.parsed_date as parsedDate,
      e.parsed_time as parsedTime,
      e.duration_minutes as durationMinutes,
      e.description,
      e.created_at as createdAt
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
    query += ` AND e.raw_text LIKE ?`
    params.push(`%${filterValue}%`)
  } else if (filterType === 'date' && filterValue) {
    query += ` AND e.parsed_date = ?`
    params.push(filterValue)
  }

  query += ` ORDER BY e.parsed_date DESC, e.parsed_time DESC, e.created_at DESC LIMIT 100`

  const entries = await c.env.DB.prepare(query).bind(...params).all()

  // Načíst tagy a klienty pro každý záznam
  const results = await Promise.all(
    (entries.results || []).map(async (entry: Record<string, unknown>) => {
      const tags = await c.env.DB.prepare(`
        SELECT t.name FROM tags t
        JOIN entry_tags et ON t.id = et.tag_id
        WHERE et.entry_id = ?
      `).bind(entry.id).all()

      const clients = await c.env.DB.prepare(`
        SELECT cl.name FROM clients cl
        JOIN entry_clients ec ON cl.id = ec.client_id
        WHERE ec.entry_id = ?
      `).bind(entry.id).all()

      return {
        ...entry,
        hashtags: (tags.results || []).map((t: Record<string, unknown>) => t.name),
        clients: (clients.results || []).map((cl: Record<string, unknown>) => cl.name),
      }
    })
  )

  return c.json(results)
})

// Vytvořit záznam
entriesRoutes.post('/', async (c) => {
  const userId = c.get('jwtPayload').sub
  const body = await c.req.json<{
    rawText: string
    date: string
    time: string | null
    durationMinutes: number
    description: string
    hashtags: string[]
    clients: string[]
  }>()

  const entryId = generateId()

  // Vložit záznam
  await c.env.DB.prepare(`
    INSERT INTO entries (id, user_id, raw_text, parsed_date, parsed_time, duration_minutes, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    entryId,
    userId,
    body.rawText,
    body.date,
    body.time,
    body.durationMinutes,
    body.description
  ).run()

  // Zpracovat hashtagy
  for (const tagName of body.hashtags) {
    // Najít nebo vytvořit tag
    let tag = await c.env.DB.prepare(
      'SELECT id FROM tags WHERE user_id = ? AND name = ?'
    ).bind(userId, tagName).first<{ id: string }>()

    if (!tag) {
      const tagId = generateId()
      await c.env.DB.prepare(
        'INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)'
      ).bind(tagId, userId, tagName).run()
      tag = { id: tagId }
    }

    // Propojit s entry
    await c.env.DB.prepare(
      'INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)'
    ).bind(entryId, tag.id).run()
  }

  // Zpracovat klienty
  for (const clientName of body.clients) {
    let client = await c.env.DB.prepare(
      'SELECT id FROM clients WHERE user_id = ? AND name = ?'
    ).bind(userId, clientName).first<{ id: string }>()

    if (!client) {
      const clientId = generateId()
      await c.env.DB.prepare(
        'INSERT INTO clients (id, user_id, name) VALUES (?, ?, ?)'
      ).bind(clientId, userId, clientName).run()
      client = { id: clientId }
    }

    await c.env.DB.prepare(
      'INSERT INTO entry_clients (entry_id, client_id) VALUES (?, ?)'
    ).bind(entryId, client.id).run()
  }

  return c.json({ id: entryId, success: true }, 201)
})

// Upravit záznam
entriesRoutes.put('/:id', async (c) => {
  const userId = c.get('jwtPayload').sub
  const entryId = c.req.param('id')
  const body = await c.req.json<{
    rawText: string
    date: string
    time: string | null
    durationMinutes: number
    description: string
    hashtags: string[]
    clients: string[]
  }>()

  // Ověřit vlastnictví
  const entry = await c.env.DB.prepare(
    'SELECT id FROM entries WHERE id = ? AND user_id = ?'
  ).bind(entryId, userId).first()

  if (!entry) {
    return c.json({ error: 'Záznam nenalezen' }, 404)
  }

  // Aktualizovat záznam
  await c.env.DB.prepare(`
    UPDATE entries SET
      raw_text = ?,
      parsed_date = ?,
      parsed_time = ?,
      duration_minutes = ?,
      description = ?
    WHERE id = ?
  `).bind(
    body.rawText,
    body.date,
    body.time,
    body.durationMinutes,
    body.description,
    entryId
  ).run()

  // Smazat staré vazby
  await c.env.DB.prepare('DELETE FROM entry_tags WHERE entry_id = ?').bind(entryId).run()
  await c.env.DB.prepare('DELETE FROM entry_clients WHERE entry_id = ?').bind(entryId).run()

  // Přidat nové hashtagy
  for (const tagName of body.hashtags) {
    let tag = await c.env.DB.prepare(
      'SELECT id FROM tags WHERE user_id = ? AND name = ?'
    ).bind(userId, tagName).first<{ id: string }>()

    if (!tag) {
      const tagId = generateId()
      await c.env.DB.prepare(
        'INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)'
      ).bind(tagId, userId, tagName).run()
      tag = { id: tagId }
    }

    await c.env.DB.prepare(
      'INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)'
    ).bind(entryId, tag.id).run()
  }

  // Přidat nové klienty
  for (const clientName of body.clients) {
    let client = await c.env.DB.prepare(
      'SELECT id FROM clients WHERE user_id = ? AND name = ?'
    ).bind(userId, clientName).first<{ id: string }>()

    if (!client) {
      const clientId = generateId()
      await c.env.DB.prepare(
        'INSERT INTO clients (id, user_id, name) VALUES (?, ?, ?)'
      ).bind(clientId, userId, clientName).run()
      client = { id: clientId }
    }

    await c.env.DB.prepare(
      'INSERT INTO entry_clients (entry_id, client_id) VALUES (?, ?)'
    ).bind(entryId, client.id).run()
  }

  return c.json({ success: true })
})

// Smazat záznam
entriesRoutes.delete('/:id', async (c) => {
  const userId = c.get('jwtPayload').sub
  const entryId = c.req.param('id')

  // Ověřit vlastnictví
  const entry = await c.env.DB.prepare(
    'SELECT id FROM entries WHERE id = ? AND user_id = ?'
  ).bind(entryId, userId).first()

  if (!entry) {
    return c.json({ error: 'Záznam nenalezen' }, 404)
  }

  // Smazat vazby
  await c.env.DB.prepare('DELETE FROM entry_tags WHERE entry_id = ?').bind(entryId).run()
  await c.env.DB.prepare('DELETE FROM entry_clients WHERE entry_id = ?').bind(entryId).run()

  // Smazat záznam
  await c.env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(entryId).run()

  return c.json({ success: true })
})
