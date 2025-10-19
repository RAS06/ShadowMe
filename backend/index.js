// Backend application entry point
console.log('ShadowMe Backend Server');
console.log('Server starting on port 3000...');

// Express + MongoDB backend
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || '';

let dbClient = null;
let db = null;

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('No MONGODB_URI provided; continuing without DB.');
    return;
  }
  dbClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await dbClient.connect();
    db = dbClient.db(process.env.MONGO_INITDB_DATABASE || 'shadowme');
    console.log('Connected to MongoDB successfully.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message || err);
  }
}

// Simple health endpoint
app.get('/api/ping', (req, res) => res.json({ ok: true, time: Date.now() }));

// Example endpoint that uses the DB if present
app.get('/api/items', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'DB not available' });
  const items = await db.collection('items').find().toArray();
  res.json(items);
});

// Serve static built frontend if present
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

const server = app.listen(port, async () => {
  console.log(`Backend server listening on port ${port}`);
  await connectDB();
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  try {
    if (dbClient) await dbClient.close();
  } catch (e) {
    console.warn('Error closing DB client', e.message || e);
  }
  server.close(() => process.exit(0));
});
