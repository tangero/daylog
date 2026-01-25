import { sign, verify } from 'hono/jwt'

const JWT_ISSUER = 'progressor-api'
const JWT_AUDIENCE = 'progressor-app'

interface TokenPayload {
  sub: string
  email: string
  iss: string
  aud: string
  iat: number
  exp: number
  jti: string
}

export async function createAccessToken(userId: string, email: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return sign({
    sub: userId,
    email,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: now,
    exp: now + 15 * 60, // 15 minut
    jti: crypto.randomUUID(),
  }, secret)
}

export async function createRefreshToken(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyAccessToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const payload = await verify(token, secret) as unknown as TokenPayload
    // Ověř issuer a audience
    if (payload.iss !== JWT_ISSUER || payload.aud !== JWT_AUDIENCE) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export { JWT_ISSUER, JWT_AUDIENCE }
