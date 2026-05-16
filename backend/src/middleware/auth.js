const jwt = require('jsonwebtoken')
const { prisma } = require('../db')

const JWT_SECRET = process.env.JWT_SECRET || 'motionise-super-secret-key'

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user' })
    }
    
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
  }
}

module.exports = { requireAuth, JWT_SECRET }
