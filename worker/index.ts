import { Hono } from 'hono'
import { authRoutes } from './routes/auth'
import { parseCookies } from './lib/cookies'
import { verifyAccessToken } from './lib/jwt'
import { entriesRoutes } from './routes/entries'
import { tagsRoutes } from './routes/tags'
import { clientsRoutes } from './routes/clients'
import { statsRoutes } from './routes/stats'
import { projectsRoutes } from './routes/projects'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

// CORS - omezeno na povolené domény
const ALLOWED_ORIGINS = [
  'https://progressor.work',
  'http://localhost:5173',
  'http://localhost:4173'
]

app.use('/*', async (c, next) => {
  const origin = c.req.header('Origin')
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Access-Control-Allow-Credentials', 'true')
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204)
  }
  await next()
})

// Security headers
app.use('/*', async (c, next) => {
  // Content Security Policy
  c.header('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://progressor-api.zandl.workers.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '))
  
  // Další bezpečnostní hlavičky
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  await next()
})

// Veřejné routy
app.route('/api/auth', authRoutes)

// Health check (veřejný)
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// JWT middleware pro chráněné routy - podporuje cookie i Authorization header
app.use('/api/*', async (c, next) => {
  // Přeskočit auth a health routy
  if (c.req.path.startsWith('/api/auth') || c.req.path === '/api/health') {
    return next()
  }

  // Zkusit token z cookie
  const cookies = parseCookies(c.req.header('Cookie'))
  let token = cookies['access_token']
  
  // Fallback na Authorization header (pro zpětnou kompatibilitu)
  if (!token) {
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = await verifyAccessToken(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('jwtPayload', { sub: payload.sub, email: payload.email })
  return next()
})

app.route('/api/entries', entriesRoutes)
app.route('/api/tags', tagsRoutes)
app.route('/api/clients', clientsRoutes)
app.route('/api/stats', statsRoutes)
app.route('/api/projects', projectsRoutes)

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error(err)

  // JWT chyby - neplatný nebo chybějící token
  if (err.message?.includes('jwt') || err.message?.includes('JWT') ||
      err.message?.includes('token') || err.message?.includes('Unauthorized')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({ error: 'Internal server error' }, 500)
})

export default app
