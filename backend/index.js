// Backend application entry point
console.log('ShadowMe Backend Server');
console.log('Server starting on port 3000...');

// Express + MongoDB backend (now using Mongoose)

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')

// load .env if present
require('dotenv').config()


const app = express()
app.use(cors({
  origin: true,
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const port = process.env.PORT || 3000
// Do not cache MONGODB_URI at module load time; read it when connectDB() is called
// so test runners and CI can inject the env var before calling connectDB().

let _mongoMemoryServer = null

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  // Require a MONGODB_URI to be provided via env (no in-memory fallback)
  if (!MONGODB_URI) {
    console.error('connectDB: MONGODB_URI is not set. Aborting connect.')
    return
  }

  try {
    await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGO_INITDB_DATABASE || 'shadowme' })
    console.log('Connected to MongoDB via Mongoose successfully.')
  } catch (err) {
    console.error('Failed to connect to MongoDB (Mongoose):', err.message || err)
  }
}

async function stopDB() {
  try {
    await mongoose.disconnect()
  } catch (e) {}
}

// Export app and connectDB for use in server.js and tests
module.exports = { app, connectDB, stopDB };

// Simple health endpoint
app.get('/api/ping', (req, res) => res.json({ ok: true, time: Date.now() }));

// Example endpoint that uses the DB if present
app.get('/api/items', async (req, res) => {
  // If mongoose isn't connected yet, respond accordingly
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'DB not available' })
  const Item = mongoose.model('Item', new mongoose.Schema({}, { strict: false, collection: 'items' }))
  const items = await Item.find().lean().exec()
  res.json(items)
});

// Mount auth routes
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

// Mount appointments routes
const appointmentsRoutes = require('./routes/appointments')
app.use('/api/appointments', appointmentsRoutes)

// Mount admin routes
const adminRoutes = require('./routes/admin')
app.use('/api/admin', adminRoutes)

// Mount doctors routes (doctor profile management)
try {
  const doctorsRoutes = require('./routes/doctors')
  app.use('/api/doctors', doctorsRoutes)
} catch (e) {
  console.warn('doctors routes not present', e.message)
}

// Mount dev-only utilities (seed token)
try {
  const devRoutes = require('./routes/dev')
  app.use('/api/dev', devRoutes)
} catch (e) {
  // ignore if not present
}

// Mount chat routes
try {
  const chatRoutes = require('./routes/chat')
  app.use('/api/chat', chatRoutes)
} catch (e) {
  console.warn('chat routes not present', e && e.message)
}

// Protected route to return current user info
const authMiddleware = require('./middleware/auth')
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const User = require('./models/User')
    const user = await User.findOne({ id: req.user.id }).lean().exec()
    if (!user) return res.status(404).json({ error: 'User not found' })
    // sanitize
    const { passwordHash, _id, __v, ...safe } = user
    res.json({ user: safe })
  } catch (err) {
    console.error('/api/me error', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Serve static built frontend if present
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// Server startup moved to server.js
