const { Router } = require('express')
const { z }      = require('zod')
const { prisma } = require('../db')
const { simulateExport, simulateGenerate } = require('../workers/jobWorker')

const router = Router()

const ExportSchema = z.object({
  projectId: z.string(),
  format:    z.string().default('mp4'),
  resolution:z.string().default('1080p'),
  fps:       z.string().default('24'),
  quality:   z.number().min(10).max(100).default(80),
  filename:  z.string().default('Motionise_Export'),
})

const GenerateSchema = z.object({
  projectId: z.string(),
  prompt:    z.string().min(1),
})

// POST /api/jobs/export
router.post('/export', async (req, res, next) => {
  try {
    const payload = ExportSchema.parse(req.body)
    const job = await prisma.job.create({
      data: { type: 'export', payload, projectId: payload.projectId },
    })
    // Kick off simulation in the background (non-blocking)
    simulateExport(job.id, payload.filename).catch(console.error)
    res.status(201).json(job)
  } catch (err) { next(err) }
})

// POST /api/jobs/generate
router.post('/generate', async (req, res, next) => {
  try {
    const payload = GenerateSchema.parse(req.body)
    const job = await prisma.job.create({
      data: { type: 'generate', payload, projectId: payload.projectId },
    })
    simulateGenerate(job.id, payload.prompt).catch(console.error)
    res.status(201).json(job)
  } catch (err) { next(err) }
})

// GET /api/jobs/:id — poll status
router.get('/:id', async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } })
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
  } catch (err) { next(err) }
})

module.exports = router
