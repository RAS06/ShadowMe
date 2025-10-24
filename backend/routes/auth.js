const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connect, getDb } = require('../utils/mongo');
const { authenticateAccessToken } = require('../middleware/auth');

const router = express.Router();

// Helper to parse cookies if cookie-parser isn't used
function parseCookies(header) {
  const list = {};
  if (!header) return list;
  header.split(';').forEach(function (cookie) {
    let parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
}

// Ensure DB connection middleware
router.use(async (req, res, next) => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'shadowme';
    await connect(uri, dbName);
  } catch (err) {
    console.error('Mongo connect error in auth routes:', err);
    return res.status(500).json({ message: 'Database connection error' });
  }
  next();
});

// Signup endpoint
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const db = getDb();

      const existing = await db.collection('users').findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      const result = await db.collection('users').insertOne({
        email,
        passwordHash: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const userId = result.insertedId.toString();

      const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
      const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.collection('refreshTokens').insertOne({ token: refreshToken, userId, revoked: false, createdAt: new Date(), expiresAt });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({ token: accessToken });
    } catch (err) {
      console.error('Signup error (mongo):', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login endpoint
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const db = getDb();
      const user = await db.collection('users').findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const userId = user._id.toString();
      const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
      const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.collection('refreshTokens').insertOne({ token: refreshToken, userId, revoked: false, createdAt: new Date(), expiresAt });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ token: accessToken });
    } catch (err) {
      console.error('Login error (mongo):', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || parseCookies(req.header('cookie')).refreshToken;
    const db = getDb();
    if (token) {
      await db.collection('refreshTokens').updateMany({ token }, { $set: { revoked: true } });
    }

    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error (mongo):', err);
    return res.status(500).json({ message: 'Server error during logout' });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || parseCookies(req.header('cookie')).refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    const db = getDb();
    const stored = await db.collection('refreshTokens').findOne({ token });
    if (!stored || stored.revoked) return res.status(401).json({ message: 'Refresh token invalid' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Refresh token invalid or expired' });
    }

    const userId = payload.userId;
    await db.collection('refreshTokens').updateMany({ token }, { $set: { revoked: true } });

    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    const newRefreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.collection('refreshTokens').insertOne({ token: newRefreshToken, userId, revoked: false, createdAt: new Date(), expiresAt });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ token: accessToken });
  } catch (err) {
    console.error('Refresh token error (mongo):', err);
    return res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// Get current user endpoint - requires access token
router.get('/me', authenticateAccessToken, async (req, res) => {
  try {
    const db = getDb();
    const { ObjectId } = require('mongodb');
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) }, { projection: { passwordHash: 0 } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.id = user._id.toString();
    delete user._id;
    return res.json(user);
  } catch (err) {
    console.error('Get user error (mongo):', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
