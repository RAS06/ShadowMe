const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const RefreshToken = require('../models/RefreshToken')

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
    const errors = parsed.error && parsed.error.errors ? parsed.error.errors.map(e => e.message).join(', ') : 'Validation failed';
    return res.status(400).json({ error: errors });
  }
  const { fullName, email, password } = parsed.data;
  try {
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const user = new User({ fullName, email, passwordHash })
    await user.save()

    // update lastLoginAt
    user.lastLoginAt = new Date()
    await user.save()

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })

    // create refresh token stored in DB (hashed)
    const { raw: refreshToken } = await createRefreshTokenForUser(user.id)

    // Set refresh token as httpOnly, Secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_MS
    })

    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, emailVerified: user.emailVerified } })
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

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })

    // create refresh token stored in DB (hashed)
    const { raw: refreshToken } = await createRefreshTokenForUser(user.id)

    // Set refresh token as httpOnly, Secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_MS
    })

    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, emailVerified: user.emailVerified } })
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

      const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
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
