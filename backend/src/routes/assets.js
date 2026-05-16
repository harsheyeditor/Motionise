const { Router } = require('express')
const multer     = require('multer')
const path       = require('path')
const fs         = require('fs')
const { prisma } = require('../db')
const ffmpeg     = require('fluent-ffmpeg')
const ffprobe    = require('ffprobe-static')

ffmpeg.setFfprobePath(ffprobe.path)

const router = Router()

// ── Multer disk storage ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dest = path.resolve(__dirname, '../../uploads/assets')
    fs.mkdirSync(dest, { recursive: true })
    cb(null, dest)
  },
  filename: (_req, file, cb) => {
    // timestamp prefix keeps filenames unique; preserve extension
    const ext  = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}_${base}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp4|mov|webm|mkv|avi|mp3|wav|aac|ogg|m4a|png|jpg|jpeg|gif|webp|svg)$/i
    if (!allowed.test(file.originalname)) {
      return cb(new Error('Unsupported file type'))
    }
    cb(null, true)
  },
})

// ── Helpers ────────────────────────────────────────────────
function detectType(mimeType, filename) {
  if (mimeType.startsWith('video/'))  return 'video'
  if (mimeType.startsWith('audio/'))  return 'audio'
  if (mimeType.startsWith('image/'))  return 'image'
  // Fallback by extension
  const ext = path.extname(filename).toLowerCase()
  if (['.mp4','.mov','.webm','.mkv','.avi'].includes(ext)) return 'video'
  if (['.mp3','.wav','.aac','.ogg','.m4a'].includes(ext))  return 'audio'
  return 'image'
}

function formatDur(durSec) {
  if (!durSec) return '—'
  const m = Math.floor(durSec / 60)
  const s = Math.floor(durSec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Routes ─────────────────────────────────────────────────

// GET /api/assets — list all assets
router.get('/', async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({ 
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' } 
    })
    // Shape to match what the frontend AssetRow expects
    const shaped = assets.map(a => ({
      ...a,
      dur:  formatDur(a.durSec),
      size: `${a.sizeMb.toFixed(1)} MB`,
    }))
    res.json(shaped)
  } catch (err) { next(err) }
})

// POST /api/assets — upload a file
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const { file } = req
    const type    = detectType(file.mimetype, file.originalname)
    const sizeMb  = +(file.size / (1024 * 1024)).toFixed(2)
    const url     = `/uploads/assets/${file.filename}`

    let durSec = 0
    if (type === 'video' || type === 'audio') {
      const diskPath = path.resolve(__dirname, '../../uploads/assets', file.filename)
      durSec = await new Promise((resolve) => {
        ffmpeg.ffprobe(diskPath, (err, metadata) => {
          if (err || !metadata || !metadata.format) {
            console.error('ffprobe error:', err?.message || 'No metadata')
            resolve(0)
          } else {
            resolve(parseFloat(metadata.format.duration) || 0)
          }
        })
      })
    }

    const asset = await prisma.asset.create({
      data: {
        name:     file.originalname,
        type,
        filename: file.filename,
        url,
        sizeMb,
        durSec,
        mimeType: file.mimetype,
        userId:   req.user.id,
      },
    })

    res.status(201).json({
      ...asset,
      dur:  formatDur(asset.durSec),
      size: `${asset.sizeMb.toFixed(1)} MB`,
    })
  } catch (err) { next(err) }
})

// DELETE /api/assets/:id — delete asset + file from disk
router.delete('/:id', async (req, res, next) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id, userId: req.user.id } })
    if (!asset) return res.status(404).json({ error: 'Asset not found' })

    const diskPath = path.resolve(__dirname, '../../uploads/assets', asset.filename)
    if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath)

    await prisma.asset.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
