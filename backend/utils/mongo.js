const { MongoClient } = require('mongodb');

let client;
let db;

async function connect(uri, dbName) {
  if (client) return { client, db };

  // Read optional Atlas/tls options from env
  const tls = process.env.MONGODB_TLS === 'true' || uri.includes('mongodb+srv');
  const serverSelectionTimeoutMS = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '10000', 10);
  const mongoOptions = {
    // modern driver doesn't need useUnifiedTopology flag, but allow server selection timeout
    serverSelectionTimeoutMS,
    tls,
  };

  client = new MongoClient(uri, mongoOptions);
  await client.connect();
  db = client.db(dbName);
  // Ensure indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('refreshTokens').createIndex({ token: 1 }, { unique: true });
  return { client, db };
}

function getDb() {
  if (!db) throw new Error('MongoDB not connected - call connect first');
  return db;
}

async function close() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { connect, getDb, close };