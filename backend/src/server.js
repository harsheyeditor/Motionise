require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')
const path     = require('path')
const fs       = require('fs')

const projectsRouter = require('./routes/projects')
const assetsRouter   = require('./routes/assets')
const jobsRouter     = require('./routes/jobs')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Ensure upload directories exist ───────────────────────
const uploadsBase = path.resolve(__dirname, '../uploads')
;['assets', 'exports'].forEach(dir => {
  fs.mkdirSync(path.join(uploadsBase, dir), { recursive: true })
})

// ── Middleware ─────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json({ limit: '10mb' }))

// ── Static file serving ────────────────────────────────────
app.use('/uploads', express.static(uploadsBase))

// ── API Routes ─────────────────────────────────────────────
app.use('/api/projects', projectsRouter)
app.use('/api/assets',   assetsRouter)
app.use('/api/jobs',     jobsRouter)

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

// ── 404 fallback ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ── Global error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server error]', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Motionise API running on http://localhost:${PORT}`)
  console.log(`   Uploads served from ${uploadsBase}`)
})
