const express = require('express')
const router = express.Router()

// returns a fresh seed token for development only
router.get('/seed-token', (req, res) => {
  if ((process.env.NODE_ENV || 'development') === 'production') return res.status(404).json({ error: 'Not found' })
  try {
    const jwt = require('jsonwebtoken')
    const payload = {
      sub: process.env.DEV_SEED_SUB || 'e3805ad0-11d3-4af8-be26-834eae3aed98',
      email: process.env.DEV_SEED_EMAIL || 'doctor@email.com',
      role: process.env.DEV_SEED_ROLE || 'doctor',
      profileId: process.env.DEV_SEED_PROFILEID || 'fe3b7be3-c4f5-482b-b647-3a400b3c3259'
    }
    const secret = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'
    const token = jwt.sign(payload, secret, { expiresIn: process.env.DEV_SEED_EXPIRES || '30d' })
    res.json({ token, user: { id: payload.sub, email: payload.email, role: payload.role, profileId: payload.profileId } })
  } catch (err) {
    console.warn('dev seed error', err && err.message)
    res.status(500).json({ error: 'Failed to generate seed token' })
  }
})

module.exports = router
