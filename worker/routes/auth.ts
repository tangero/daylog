import { Hono } from 'hono'
import { sign } from 'hono/jwt'

interface Env {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
}

export const authRoutes = new Hono<{ Bindings: Env }>()

// Hashování hesel pomocí SHA-256 + salt (pro Cloudflare Workers kompatibilitu)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'progressor-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !password) {
    return false
  }
  const inputHash = await hashPassword(password)
  return inputHash === hash
}

function generateId(): string {
  return crypto.randomUUID()
}

// Registrace
authRoutes.post('/register', async (c) => {
  try {
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

    if (!user.password_hash) {
      console.error('[LOGIN] User has no password hash:', email)
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
