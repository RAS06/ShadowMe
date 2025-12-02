// Jest setup: require MONGODB_URI be set (use .env) and ensure mongoose disconnects after tests.
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.MONGO_INITDB_DATABASE = process.env.MONGO_INITDB_DATABASE || 'shadowme_test'
const mongoose = require('mongoose')
require('dotenv').config()

// Indicate whether tests will have a MongoDB available. Some unit tests
// (pure functions) do not require a DB; those should check `global.HAS_MONGODB`.
global.HAS_MONGODB = Boolean(process.env.MONGODB_URI)
if (!global.HAS_MONGODB) {
  /* eslint-disable no-console */
  console.warn('jest.setup: MONGODB_URI is not set. DB-dependent tests will be skipped.')
}

afterAll(async () => {
  try {
    await mongoose.disconnect()
  } catch (e) {}
})
