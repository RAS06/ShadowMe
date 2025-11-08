const mongoose = require('mongoose')
require('dotenv').config()

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', { dbName: process.env.MONGO_INITDB_DATABASE || 'shadowme' })
  const User = require('../models/User')
  const res = await User.updateOne({ email: 'trial_admin_1@example.com' }, { $set: { role: 'admin' } })
  console.log('update result', res)
  await mongoose.disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
