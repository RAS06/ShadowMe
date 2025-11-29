const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const RefreshToken = require('../models/RefreshToken')
const Doctor = require('../models/Doctor')
const Student = require('../models/Student')

const { z } = require('zod');
// Zod schemas with approved regexes
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=(?:[^0-9]*[0-9]){2,})(?=(?:[^!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]){2,}).{8,}$/;
// Require at least two words, each at least 2 letters, letters or hyphens only
const fullNameRegex = /^[A-Za-z-]{2,}(?: [A-Za-z-]{2,})+$/;

const registerSchema = z.object({
  email: z.string().regex(emailRegex, 'Invalid email address'),
  password: z.string().regex(passwordRegex, 'Password must be at least 8 characters, contain at least 2 numbers and 2 special characters'),
  fullName: z.string().regex(
    fullNameRegex,
    'Full name must be at least two words and may contain only letters or hyphens.'
  ),
});

const loginSchema = z.object({
  email: z.string().regex(emailRegex, 'Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'
// access token lifetime (short)
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
// refresh token lifetime in ms (16 hours = 16*60*60*1000 = 57600000)
const REFRESH_TOKEN_TTL_MS = 16 * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function createRefreshTokenForUser(userId) {
  // create a cryptographically random token (raw token returned to client)
  const raw = crypto.randomBytes(48).toString('base64url')
  const tokenHash = hashToken(raw)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  const doc = new RefreshToken({ id: crypto.randomUUID(), userId, tokenHash, expiresAt })
  await doc.save()
  return { raw, doc }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('Register endpoint hit. req.body:', req.body);
  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body' });
  }
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error && parsed.error.errors ? parsed.error.errors.map(e => ({ path: e.path, message: e.message })) : ['Validation failed'];
    // In development, include raw parse error details to help debugging
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      console.warn('Register validation failed:', JSON.stringify(errors))
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }
    return res.status(400).json({ error: 'Validation failed' });
  }
  const { fullName, email, password } = parsed.data;
  // profile data
  const profileData = req.body.profile || {}
  try {
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Always create a Student profile on registration. Doctor accounts must be created via admin promotion.
    const address = profileData.address || ''
    let loc
    if (profileData.location && Array.isArray(profileData.location.coordinates) && profileData.location.coordinates.length === 2) {
      const lng = parseFloat(profileData.location.coordinates[0])
      const lat = parseFloat(profileData.location.coordinates[1])
      if (isFinite(lng) && isFinite(lat)) loc = { type: 'Point', coordinates: [lng, lat] }
    }
    const student = new Student({ address, location: loc })
    await student.save()

    // create user once with profile link and initial lastLoginAt
    const user = new User({ fullName, email, passwordHash, role: 'student', profileId: student.id, lastLoginAt: new Date() })
    await user.save()
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, profileId: user.profileId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })

    // create refresh token stored in DB (hashed)
    const { raw: refreshToken } = await createRefreshTokenForUser(user.id)

    // Set refresh token as httpOnly, Secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_MS
    })

    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, emailVerified: user.emailVerified, role: user.role, profileId: user.profileId } })
  } catch (err) {
    console.error('Registration error', err)
    res.status(500).json({ error: 'Registration failed' })
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });
  }
  const { email, password } = parsed.data;
  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    // set lastLoginAt
    user.lastLoginAt = new Date()
    await user.save()

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, profileId: user.profileId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })

    // create refresh token stored in DB (hashed)
    const { raw: refreshToken } = await createRefreshTokenForUser(user.id)

    // Set refresh token as httpOnly, Secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_MS
    })

    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, emailVerified: user.emailVerified, role: user.role, profileId: user.profileId } })
  } catch (err) {
    console.error('Login error', err)
    res.status(500).json({ error: 'Login failed' })
  }
});

// POST /api/auth/refresh
// Accepts { refreshToken } (raw string). Validates against DB and issues a new access token.
router.post('/refresh',
  async (req, res) => {
    // Try to get refreshToken from body, else from cookie
    let refreshToken = req.body && req.body.refreshToken;
    if (!refreshToken && req.cookies) {
      refreshToken = req.cookies.refreshToken;
    }
    if (!refreshToken) {
      return res.status(400).json({ errors: [
        { type: 'field', msg: 'Missing refresh token', path: 'refreshToken', location: 'body/cookie' }
      ] });
    }
    try {
      const tokenHash = hashToken(refreshToken)
      const stored = await RefreshToken.findOne({ tokenHash })
      if (!stored) return res.status(401).json({ error: 'Invalid refresh token' })
      if (stored.isRevoked) return res.status(401).json({ error: 'Refresh token revoked' })
      if (stored.expiresAt < new Date()) return res.status(401).json({ error: 'Refresh token expired' })

      // Find user
      const user = await User.findOne({ id: stored.userId })
      if (!user) return res.status(401).json({ error: 'User not found' })

      // rotate refresh token: revoke old and issue new one
      stored.isRevoked = true
      await stored.save()

      const { raw: newRefreshToken } = await createRefreshTokenForUser(user.id)

      // Set new refresh token as httpOnly, Secure cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_TTL_MS
      })

  const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role, profileId: user.profileId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
      res.json({ token: accessToken })
    } catch (err) {
      console.error('Refresh error', err)
      res.status(500).json({ error: 'Refresh failed' })
    }
  }
)

// POST /api/auth/revoke
// Accepts { refreshToken } and marks it revoked so it can no longer be used.
router.post('/revoke',
  body('refreshToken').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { refreshToken } = req.body
    try {
      const tokenHash = hashToken(refreshToken)
      const stored = await RefreshToken.findOne({ tokenHash })
      if (!stored) return res.status(404).json({ error: 'Refresh token not found' })
      stored.isRevoked = true
      await stored.save()
      res.json({ ok: true })
    } catch (err) {
      console.error('Revoke error', err)
      res.status(500).json({ error: 'Revoke failed' })
    }
  }
)

module.exports = router

// GET /api/auth/me - return authenticated user's basic info and linked profile (student/doctor)
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const userId = req.user && req.user.id
    if (!userId) return res.status(401).json({ error: 'Missing auth' })
    const User = require('../models/User')
    const user = await User.findOne({ id: userId }).lean().exec()
    if (!user) return res.status(404).json({ error: 'User not found' })
    const out = { id: user.id, fullName: user.fullName, email: user.email, role: user.role, profileId: user.profileId }
    // attach profile basic info if available
    if (user.profileId) {
      if (user.role === 'student') {
        const Student = require('../models/Student')
        const s = await Student.findOne({ id: user.profileId }).lean().exec()
        if (s) out.profile = { address: s.address, location: s.location, name: s.name || undefined }
      } else if (user.role === 'doctor') {
        const Doctor = require('../models/Doctor')
        const d = await Doctor.findOne({ id: user.profileId }).lean().exec()
        if (d) out.profile = { clinicName: d.clinicName, address: d.address, location: d.location }
      }
    }
    // Debug: log the shaped user object we are about to return so frontend data issues can be traced
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      try {
        console.log('GET /api/auth/me -> returning user:', JSON.stringify(out))
      } catch (e) {
        console.log('GET /api/auth/me -> returning user (non-serializable):', out)
      }
    }
    res.json({ user: out })
  } catch (err) {
    console.error('Me route error', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})
