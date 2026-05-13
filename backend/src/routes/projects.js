const { Router } = require('express')
const { z }      = require('zod')
const { prisma } = require('../db')

const router = Router()

// ── Validation schemas ─────────────────────────────────────
const CreateSchema = z.object({
  name: z.string().min(1).max(200).default('Untitled Project'),
})

const UpdateSchema = z.object({
  name:     z.string().min(1).max(200).optional(),
  tracks:   z.array(z.any()).optional(),
  clips:    z.array(z.any()).optional(),
  markers:  z.array(z.any()).optional(),
  zoom:     z.number().min(10).max(300).optional(),
  totalDur: z.number().min(1).optional(),
})

// GET /api/projects — list all projects (most-recently-updated first)
router.get('/', async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, totalDur: true, createdAt: true, updatedAt: true },
    })
    res.json(projects)
  } catch (err) { next(err) }
})

// GET /api/projects/:id — load full project
router.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (err) { next(err) }
})

// POST /api/projects — create new project
router.post('/', async (req, res, next) => {
  try {
    const { name } = CreateSchema.parse(req.body)
    const project = await prisma.project.create({
      data: { name, tracks: [], clips: [], markers: [] },
    })
    res.status(201).json(project)
  } catch (err) { next(err) }
})

// PUT /api/projects/:id — save/update project state
router.put('/:id', async (req, res, next) => {
  try {
    const data = UpdateSchema.parse(req.body)
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
    })
    res.json(project)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Project not found' })
    next(err)
  }
})

// DELETE /api/projects/:id — delete project
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Project not found' })
    next(err)
  }
})

module.exports = router
