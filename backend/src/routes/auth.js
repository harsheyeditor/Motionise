const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const { prisma } = require('../db')
const { JWT_SECRET } = require('../middleware/auth')

const router = Router()

const AuthSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = AuthSchema.parse(req.body)
    
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    })

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user.id, username: user.username } })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input data' })
    next(err)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = AuthSchema.parse(req.body)
    
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, username: user.username } })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input data' })
    next(err)
  }
})

module.exports = router
