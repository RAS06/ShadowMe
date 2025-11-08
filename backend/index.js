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
const MONGODB_URI = process.env.MONGODB_URI || ''

let _mongoMemoryServer = null

async function connectDB() {
  // If a real MONGODB_URI is provided, use it. Otherwise try to start an in-memory MongoDB
  if (!MONGODB_URI) {
    try {
      // start mongodb-memory-server only when available (dev/test)
      const { MongoMemoryServer } = require('mongodb-memory-server')
      _mongoMemoryServer = await MongoMemoryServer.create()
      const memUri = _mongoMemoryServer.getUri()
      await mongoose.connect(memUri, { dbName: process.env.MONGO_INITDB_DATABASE || 'shadowme' })
      console.log('Connected to in-memory MongoDB via mongodb-memory-server.')
      // ensure we stop the memory server when mongoose disconnects
      mongoose.connection.on('disconnected', async () => {
        try {
          if (_mongoMemoryServer) await _mongoMemoryServer.stop()
        } catch (e) {
          // ignore
        }
      })
      return
    } catch (err) {
      console.warn('mongodb-memory-server not available or failed to start. Falling back to MONGODB_URI if provided.')
      // fallthrough to attempt MONGODB_URI connect (may be empty)
    }
    console.warn('No MONGODB_URI provided; continuing without DB.')
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
  try {
    if (_mongoMemoryServer) await _mongoMemoryServer.stop()
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
