#!/usr/bin/env node
// Migration: set missing user.role to 'student' and create Student profiles for users missing profileId
const mongoose = require('mongoose')
require('dotenv').config()
const User = require('../models/User')
const Student = require('../models/Student')

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGO_INITDB_DATABASE || 'shadowme' })
  console.log('Connected to DB')

  const users = await User.find({ $or: [{ role: { $exists: false } }, { profileId: { $exists: false } }] })
  console.log(`Found ${users.length} users to migrate`)
  for (const u of users) {
    let changed = false
    if (!u.role) { u.role = 'student'; changed = true }
    if (!u.profileId) {
      const student = new Student({ address: '', location: { type: 'Point', coordinates: [0, 0] } })
      await student.save()
      u.profileId = student.id
      changed = true
    }
    if (changed) await u.save()
    console.log('Migrated user', u.email)
  }

  await mongoose.disconnect()
  console.log('Migration complete')
}

run().catch(err => { console.error(err); process.exit(1) })
