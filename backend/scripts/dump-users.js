#!/usr/bin/env node
require('dotenv').config()
const mongoose = require('mongoose')
const path = require('path')

const User = require('../models/User')

// Simple arg parsing
const args = process.argv.slice(2)
let limit = null
let pretty = false
for (const a of args) {
  if (a.startsWith('--limit=')) limit = parseInt(a.split('=')[1], 10)
  if (a === '--pretty') pretty = true
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Set it in your .env or environment. Aborting.')
  process.exit(1)
}

async function run() {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGO_INITDB_DATABASE || 'shadowme' })
  console.error('Connected to DB')
  let q = User.find()
  if (limit && Number.isInteger(limit) && limit > 0) q = q.limit(limit)
  const users = await q.lean().exec()
  if (pretty) {
    console.log(JSON.stringify(users, null, 2))
  } else {
    console.log(JSON.stringify(users))
  }
  await mongoose.disconnect()
}

run().catch(err => {
  console.error('Error dumping users:', err)
  process.exit(1)
})
