import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { authRateLimit, passwordResetRateLimit } from '../middleware/rateLimit'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

export const authRoutes = new Hono<{ Bindings: Env }>()

// Rate limiting pro auth endpointy
authRoutes.use('/login', authRateLimit)
authRoutes.use('/register', authRateLimit)
authRoutes.use('/forgot-password', passwordResetRateLimit)
authRoutes.use('/reset-password', passwordResetRateLimit)

// Bezpečné hashování hesel pomocí bcrypt
const BCRYPT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Podpora pro staré SHA-256 hashe (migrace)
  if (hash.length === 64 && /^[a-f0-9]+$/.test(hash)) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'progressor-salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const oldHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return oldHash === hash
  }
  // Nové bcrypt hashe
  return bcrypt.compare(password, hash)
}

function generateId(): string {
  return crypto.randomUUID()
}

// Registrace
authRoutes.post('/register', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()

  if (!email || !password) {
    return c.json({ error: 'Email a heslo jsou povinné' }, 400)
  }

  if (password.length < 8) {
    return c.json({ error: 'Heslo musí mít alespoň 8 znaků' }, 400)
  }

  // Zkontrolovat zda email již existuje
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first()

  if (existing) {
    return c.json({ error: 'Tento email je již registrován' }, 400)
  }

  const id = generateId()
  const passwordHash = await hashPassword(password)

  await c.env.DB.prepare(
    'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
  ).bind(id, email.toLowerCase(), passwordHash).run()

  const token = await sign(
    { sub: id, email: email.toLowerCase(), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    c.env.JWT_SECRET
  )

  return c.json({ token, user: { id, email: email.toLowerCase() } })
})

// Generování bezpečného tokenu pro reset hesla
function generateResetToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

// Přihlášení
authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()

  if (!email || !password) {
    return c.json({ error: 'Email a heslo jsou povinné' }, 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, password_hash FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<{ id: string; email: string; password_hash: string }>()

  if (!user) {
    return c.json({ error: 'Neplatný email nebo heslo' }, 401)
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return c.json({ error: 'Neplatný email nebo heslo' }, 401)
  }

  const token = await sign(
    { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    c.env.JWT_SECRET
  )

  return c.json({ token, user: { id: user.id, email: user.email } })
})

// Žádost o reset hesla
authRoutes.post('/forgot-password', async (c) => {
  const { email } = await c.req.json<{ email: string }>()

  if (!email) {
    return c.json({ error: 'Email je povinný' }, 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<{ id: string; email: string }>()

  // Vždy vrátíme úspěch, aby útočník nezjistil, zda email existuje
  if (!user) {
    return c.json({ success: true, message: 'Pokud email existuje, obdržíte instrukce pro reset hesla.' })
  }

  // Invalidovat staré tokeny
  await c.env.DB.prepare(
    'DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL'
  ).bind(user.id).run()

  // Vytvořit nový token (platný 1 hodinu)
  const resetToken = generateResetToken()
  const tokenId = generateId()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  await c.env.DB.prepare(
    'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(tokenId, user.id, resetToken, expiresAt).run()

  // TODO: Integrovat email službu (Resend, SendGrid, Mailgun)
  // Pro teď logujeme do konzole
  const resetUrl = `https://progressor.pages.dev/reset-password?token=${resetToken}`
  console.log(`[PASSWORD RESET] Email: ${user.email}, URL: ${resetUrl}`)

  // Základní response bez citlivých dat
  const response: { success: boolean; message: string; _dev?: { resetUrl: string } } = {
    success: true,
    message: 'Pokud email existuje, obdržíte instrukce pro reset hesla.'
  }

  // DEV URL pouze pro localhost requesty (Origin header check)
  const origin = c.req.header('origin') || ''
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    response._dev = { resetUrl }
  }

  return c.json(response)
})

// Reset hesla s tokenem
authRoutes.post('/reset-password', async (c) => {
  const { token, password } = await c.req.json<{ token: string; password: string }>()

  if (!token || !password) {
    return c.json({ error: 'Token a nové heslo jsou povinné' }, 400)
  }

  if (password.length < 8) {
    return c.json({ error: 'Heslo musí mít alespoň 8 znaků' }, 400)
  }

  // Najít platný token
  const resetToken = await c.env.DB.prepare(`
    SELECT id, user_id, expires_at FROM password_reset_tokens
    WHERE token = ? AND used_at IS NULL
  `).bind(token).first<{ id: string; user_id: string; expires_at: string }>()

  if (!resetToken) {
    return c.json({ error: 'Neplatný nebo expirovaný odkaz pro reset hesla' }, 400)
  }

  // Zkontrolovat expiraci
  if (new Date(resetToken.expires_at) < new Date()) {
    return c.json({ error: 'Odkaz pro reset hesla vypršel' }, 400)
  }

  // Aktualizovat heslo
  const passwordHash = await hashPassword(password)
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ? WHERE id = ?'
  ).bind(passwordHash, resetToken.user_id).run()

  // Označit token jako použitý
  await c.env.DB.prepare(
    'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(resetToken.id).run()

  return c.json({ success: true, message: 'Heslo bylo úspěšně změněno' })
})
