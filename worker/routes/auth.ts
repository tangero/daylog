import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authRateLimit, passwordResetRateLimit } from '../middleware/rateLimit'
import { setAuthCookies, clearAuthCookies, parseCookies } from '../lib/cookies'
import { createAccessToken, createRefreshToken, hashRefreshToken } from '../lib/jwt'

interface Env {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
}

// Zod schémata pro validaci
const emailSchema = z.string()
  .email('Neplatný formát emailu')
  .max(255, 'Email je příliš dlouhý')
  .transform(val => val.toLowerCase())

const passwordSchema = z.string()
  .min(8, 'Heslo musí mít alespoň 8 znaků')
  .max(100, 'Heslo je příliš dlouhé')

const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token je povinný'),
  password: passwordSchema,
})

export const authRoutes = new Hono<{ Bindings: Env }>()

// Rate limiting pro auth routy
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
  if (!hash || !password) {
    return false
  }
  // Zpětná kompatibilita: detekce starého SHA-256 hashe (64 hex znaků)
  if (hash.length === 64 && /^[a-f0-9]+$/.test(hash)) {
    // Starý SHA-256 hash - ověřit starým způsobem
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'progressor-salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const oldHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return oldHash === hash
  }
  // Nový bcrypt hash
  return bcrypt.compare(password, hash)
}

function generateId(): string {
  return crypto.randomUUID()
}

// Registrace
authRoutes.post('/register', async (c) => {
  try {
    // Validace vstupu
    const rawBody = await c.req.json()
    const parseResult = authSchema.safeParse(rawBody)

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => e.message).join(', ')
      return c.json({ error: errors }, 400)
    }

    const { email, password } = parseResult.data

    // Zkontrolovat zda email již existuje
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existing) {
      return c.json({ error: 'Tento email je již registrován' }, 400)
    }

    const id = generateId()
    const passwordHash = await hashPassword(password)

    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
    ).bind(id, email, passwordHash).run()

    // Vytvořit access a refresh token
    const accessToken = await createAccessToken(id, email, c.env.JWT_SECRET)
    const refreshToken = await createRefreshToken()
    const refreshTokenHash = await hashRefreshToken(refreshToken)

    // Uložit session do DB
    const sessionId = generateId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(sessionId, id, refreshTokenHash, c.req.header('User-Agent') || null, c.req.header('CF-Connecting-IP') || null, expiresAt).run()

    // Nastavit cookies
    setAuthCookies(c, accessToken, refreshToken)

    // Vrátit token i v odpovědi pro localStorage (fallback pro prohlížeče blokující cross-origin cookies)
    return c.json({ user: { id, email }, token: accessToken })
  } catch (error) {
    console.error('[REGISTER] Error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Generování bezpečného tokenu pro reset hesla
function generateResetToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

// Přihlášení
authRoutes.post('/login', async (c) => {
  try {
    // Validace vstupu
    const rawBody = await c.req.json()
    const parseResult = authSchema.safeParse(rawBody)

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => e.message).join(', ')
      return c.json({ error: errors }, 400)
    }

    const { email, password } = parseResult.data

    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash FROM users WHERE email = ?'
    ).bind(email).first<{ id: string; email: string; password_hash: string }>()

    if (!user) {
      return c.json({ error: 'Neplatný email nebo heslo' }, 401)
    }

    if (!user.password_hash) {
      console.error('[LOGIN] User has no password hash:', email)
      return c.json({ error: 'Neplatný email nebo heslo' }, 401)
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return c.json({ error: 'Neplatný email nebo heslo' }, 401)
    }

    // Vytvořit access a refresh token
    const accessToken = await createAccessToken(user.id, user.email, c.env.JWT_SECRET)
    const refreshToken = await createRefreshToken()
    const refreshTokenHash = await hashRefreshToken(refreshToken)

    // Uložit session do DB
    const sessionId = generateId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(sessionId, user.id, refreshTokenHash, c.req.header('User-Agent') || null, c.req.header('CF-Connecting-IP') || null, expiresAt).run()

    // Nastavit cookies
    setAuthCookies(c, accessToken, refreshToken)

    // Vrátit token i v odpovědi pro localStorage (fallback pro prohlížeče blokující cross-origin cookies)
    return c.json({ user: { id: user.id, email: user.email }, token: accessToken })
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    return c.json({ error: String(error) }, 500)
  }
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

  // Vytvořit nový token (platný 1 hodinu)
  const resetToken = generateResetToken()
  const tokenId = generateId()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  // Atomicky: invalidovat staré tokeny a vytvořit nový
  await c.env.DB.batch([
    c.env.DB.prepare(
      'DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL'
    ).bind(user.id),
    c.env.DB.prepare(
      'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(tokenId, user.id, resetToken, expiresAt)
  ])

  const resetUrl = `https://progressor.work/reset-password?token=${resetToken}`

  // Odeslat email přes Resend API (fetch)
  try {
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Reset hesla</h2>
        <p>Obdrželi jsme žádost o reset hesla pro váš účet v aplikaci Progressor.</p>
        <p>Klikněte na tlačítko níže pro nastavení nového hesla:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Resetovat heslo
        </a>
        <p style="color: #666; font-size: 14px;">Odkaz je platný 1 hodinu.</p>
        <p style="color: #666; font-size: 14px;">Pokud jste o reset hesla nežádali, tento email ignorujte.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">Progressor - sledování aktivit</p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Progressor <noreply@prolnuto.cz>',
        to: user.email,
        subject: 'Reset hesla - Progressor',
        html: emailHtml,
      }),
    })

    if (response.ok) {
      console.log(`[PASSWORD RESET] Email sent to: ${user.email}`)
    } else {
      const error = await response.text()
      console.error('[PASSWORD RESET] Resend API error:', error)
    }
  } catch (error) {
    console.error('[PASSWORD RESET] Failed to send email:', error)
  }

  return c.json({
    success: true,
    message: 'Pokud email existuje, obdržíte instrukce pro reset hesla.'
  })
})

// Reset hesla s tokenem
authRoutes.post('/reset-password', async (c) => {
  // Validace vstupu
  const rawBody = await c.req.json()
  const parseResult = resetPasswordSchema.safeParse(rawBody)

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(e => e.message).join(', ')
    return c.json({ error: errors }, 400)
  }

  const { token, password } = parseResult.data

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

// Obnovení access tokenu pomocí refresh tokenu
authRoutes.post('/refresh', async (c) => {
  const cookies = parseCookies(c.req.header('Cookie'))
  const refreshToken = cookies['refresh_token']

  if (!refreshToken) {
    return c.json({ error: 'Refresh token chybí' }, 401)
  }

  const refreshTokenHash = await hashRefreshToken(refreshToken)

  const session = await c.env.DB.prepare(`
    SELECT s.id, s.user_id, u.email
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.refresh_token_hash = ? AND s.expires_at > datetime('now') AND s.revoked_at IS NULL
  `).bind(refreshTokenHash).first<{ id: string; user_id: string; email: string }>()

  if (!session) {
    clearAuthCookies(c)
    return c.json({ error: 'Neplatný nebo expirovaný refresh token' }, 401)
  }

  // Rotovat refresh token
  const newRefreshToken = await createRefreshToken()
  const newRefreshTokenHash = await hashRefreshToken(newRefreshToken)
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE sessions SET revoked_at = datetime("now") WHERE id = ?').bind(session.id),
    c.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(generateId(), session.user_id, newRefreshTokenHash, c.req.header('User-Agent') || null, c.req.header('CF-Connecting-IP') || null, newExpiresAt)
  ])

  const accessToken = await createAccessToken(session.user_id, session.email, c.env.JWT_SECRET)
  setAuthCookies(c, accessToken, newRefreshToken)

  // Vrátit token i v odpovědi pro localStorage (fallback pro prohlížeče blokující cross-origin cookies)
  return c.json({ user: { id: session.user_id, email: session.email }, token: accessToken })
})

// Odhlášení
authRoutes.post('/logout', async (c) => {
  const cookies = parseCookies(c.req.header('Cookie'))
  const refreshToken = cookies['refresh_token']

  if (refreshToken) {
    const refreshTokenHash = await hashRefreshToken(refreshToken)
    await c.env.DB.prepare('UPDATE sessions SET revoked_at = datetime("now") WHERE refresh_token_hash = ?').bind(refreshTokenHash).run()
  }

  clearAuthCookies(c)
  return c.json({ success: true })
})

// Odhlášení ze všech zařízení
authRoutes.post('/logout-all', async (c) => {
  const cookies = parseCookies(c.req.header('Cookie'))
  const refreshToken = cookies['refresh_token']

  if (!refreshToken) {
    return c.json({ error: 'Nepřihlášen' }, 401)
  }

  const refreshTokenHash = await hashRefreshToken(refreshToken)
  const session = await c.env.DB.prepare(
    'SELECT user_id FROM sessions WHERE refresh_token_hash = ? AND revoked_at IS NULL'
  ).bind(refreshTokenHash).first<{ user_id: string }>()

  if (session) {
    await c.env.DB.prepare('UPDATE sessions SET revoked_at = datetime("now") WHERE user_id = ?').bind(session.user_id).run()
  }

  clearAuthCookies(c)
  return c.json({ success: true })
})
