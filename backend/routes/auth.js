const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateAccessToken, parseCookies } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      // Create access token
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Create refresh token - long lived
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // Persist refresh token in DB
      const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)); // 7 days
      await prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt }
      });

      // Set httpOnly cookie for refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({ token: accessToken });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error' });
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
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Create access token
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Create refresh token and persist
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)); // 7 days
      await prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt }
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ token: accessToken });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Logout endpoint (requires authentication)
// Logout endpoint - clear refresh token cookie and mark token revoked
router.post('/logout', async (req, res) => {
  try {
    // Try to read refresh token from cookies
    const cookies = parseCookies(req.header('cookie'));
    const token = cookies.refreshToken;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revoked: true }
      });
    }

    // Clear cookie
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error during logout' });
  }
});

// Refresh token endpoint - issues new access token (and rotate refresh token)
router.post('/refresh-token', async (req, res) => {
  try {
    const cookies = parseCookies(req.header('cookie'));
    const token = cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    // Find stored refresh token
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revoked) {
      return res.status(401).json({ message: 'Refresh token invalid' });
    }

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Refresh token invalid or expired' });
    }

    // Optionally rotate refresh token
    const userId = payload.userId;
    // Revoke old token
    await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });

    // Issue new tokens
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));
    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId, expiresAt } });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ token: accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// Get current user (requires authentication)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;