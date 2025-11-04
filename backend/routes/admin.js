const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/requireRole')
const auth = require('../middleware/auth')
const User = require('../models/User')
const Doctor = require('../models/Doctor')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'

// Admin-only: promote a user to doctor
// Body: { userId: <user.id>, clinicName, address, location: { coordinates: [lng, lat] } }
router.post('/promote', async (req, res, next) => {
  // Hardened behavior:
  // - If ADMIN_API_KEY is configured, require callers to present matching x-admin-key header (403 otherwise).
  // - If ADMIN_API_KEY is not configured, require the caller to be an authenticated admin via JWT.
  const adminKey = process.env.ADMIN_API_KEY
  const provided = req.headers['x-admin-key']
  if (adminKey) {
    // if header provided and matches, allow
    if (provided && provided === adminKey) return next()
    // if header provided but does not match, reject
    if (provided && provided !== adminKey) return res.status(403).json({ error: 'Invalid admin key' })
    // header not provided: require an Authorization header (JWT) as fallback; otherwise reject with 403
    const authHeader = req.headers['authorization']
    if (!authHeader) return res.status(403).json({ error: 'Missing admin key' })
    // run auth middleware first to populate req.user, then role check
    return auth(req, res, (err) => {
      if (err) return res.status(401).json({ error: 'Invalid auth' })
      return requireRole('admin')(req, res, next)
    })
  }
  // no admin key configured: require admin role via JWT
  return auth(req, res, (err) => {
    if (err) return res.status(401).json({ error: 'Invalid auth' })
    return requireRole('admin')(req, res, next)
  })
}, async (req, res) => {
  if ((process.env.NODE_ENV || 'development') !== 'production') console.log('Admin promote body:', req.body)
  try {
    const { userId, clinicName, address, location } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })
    const user = await User.findOne({ id: userId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // create doctor profile
    const loc = location && Array.isArray(location.coordinates) ? { type: 'Point', coordinates: location.coordinates } : { type: 'Point', coordinates: [0,0] }
  const doctor = new Doctor({ clinicName: clinicName || `${user.fullName}'s Clinic`, address: address || 'Unknown address', location: loc, doctorName: user.fullName })
    await doctor.save()

  user.role = 'doctor'
  user.profileId = doctor.id
  await user.save()

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, profileId: user.profileId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
  res.json({ ok: true, doctorId: doctor.id, token })
  } catch (err) {
    console.error('Promote error', err)
    res.status(500).json({ error: 'Failed to promote user' })
  }
})

module.exports = router
