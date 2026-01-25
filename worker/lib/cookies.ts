import { Context } from 'hono'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax' as const,
  path: '/',
}

export function setAuthCookies(c: Context, accessToken: string, refreshToken: string) {
  // Access token - krátká platnost (15 minut)
  c.header('Set-Cookie', `access_token=${accessToken}; ${formatCookieOptions({ ...COOKIE_OPTIONS, maxAge: 15 * 60 })}`, { append: true })
  // Refresh token - delší platnost (7 dní)
  c.header('Set-Cookie', `refresh_token=${refreshToken}; ${formatCookieOptions({ ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 })}`, { append: true })
}

export function clearAuthCookies(c: Context) {
  c.header('Set-Cookie', `access_token=; ${formatCookieOptions({ ...COOKIE_OPTIONS, maxAge: 0 })}`, { append: true })
  c.header('Set-Cookie', `refresh_token=; ${formatCookieOptions({ ...COOKIE_OPTIONS, maxAge: 0 })}`, { append: true })
}

function formatCookieOptions(options: { httpOnly: boolean; secure: boolean; sameSite: string; path: string; maxAge: number }): string {
  const parts = []
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
  if (options.path) parts.push(`Path=${options.path}`)
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`)
  return parts.join('; ')
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) acc[key] = value
    return acc
  }, {} as Record<string, string>)
}
