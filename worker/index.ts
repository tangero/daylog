import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { authRoutes } from './routes/auth'
import { entriesRoutes } from './routes/entries'
import { tagsRoutes } from './routes/tags'
import { clientsRoutes } from './routes/clients'
import { statsRoutes } from './routes/stats'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

// CORS - povolit všechny origins pro vývoj a produkci
app.use('/*', cors({
  origin: (origin) => {
    // Povolit localhost pro vývoj
    if (origin?.includes('localhost')) return origin
    // Povolit Cloudflare Pages
    if (origin?.includes('.pages.dev')) return origin
    // Povolit vlastní domény
    if (origin?.includes('progressor')) return origin
    return 'https://progressor.pages.dev'
  },
  credentials: true,
}))

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

  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET })
  return jwtMiddleware(c, next)
})

app.route('/api/entries', entriesRoutes)
app.route('/api/tags', tagsRoutes)
app.route('/api/clients', clientsRoutes)
app.route('/api/stats', statsRoutes)

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
