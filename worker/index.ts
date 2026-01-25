import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { authRoutes } from './routes/auth'
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

// Veřejné routy
app.route('/api/auth', authRoutes)

// Health check (veřejný)
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Chráněné routy - vyžadují JWT
app.use('/api/*', async (c, next) => {
  // Přeskočit auth a health routy
  if (c.req.path.startsWith('/api/auth') || c.req.path === '/api/health') {
    return next()
  }

  // Kontrola, zda je přítomen Authorization header
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET })
  return jwtMiddleware(c, next)
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
