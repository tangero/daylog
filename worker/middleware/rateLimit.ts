import { Context, Next } from 'hono'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// In-memory store (resets when worker restarts, but sufficient for basic protection)
const store: RateLimitStore = {}

interface RateLimitOptions {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
  message?: string
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Příliš mnoho požadavků, zkuste to později' } = options

  return async (c: Context, next: Next) => {
    const ip = c.req.header('cf-connecting-ip') ||
               c.req.header('x-forwarded-for')?.split(',')[0] ||
               'unknown'
    const key = `${ip}:${c.req.path}`
    const now = Date.now()

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      for (const k in store) {
        if (store[k].resetAt < now) {
          delete store[k]
        }
      }
    }

    if (!store[key] || store[key].resetAt < now) {
      store[key] = {
        count: 1,
        resetAt: now + windowMs
      }
    } else {
      store[key].count++
    }

    const remaining = Math.max(0, max - store[key].count)
    const resetAt = store[key].resetAt

    c.header('X-RateLimit-Limit', max.toString())
    c.header('X-RateLimit-Remaining', remaining.toString())
    c.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString())

    if (store[key].count > max) {
      c.header('Retry-After', Math.ceil((resetAt - now) / 1000).toString())
      return c.json({ error: message }, 429)
    }

    await next()
  }
}

// Preset for auth routes: 5 attempts per minute
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 5,
  message: 'Příliš mnoho pokusů o přihlášení, zkuste to za minutu'
})

// Preset for password reset: 3 attempts per 15 minutes
export const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 3,
  message: 'Příliš mnoho žádostí o reset hesla, zkuste to za 15 minut'
})
