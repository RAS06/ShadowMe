/**
 * Script to clear appointments arrays from doctors and students.
 * Run with: node scripts/clear_appointments.js
 */
const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const Doctor = require('../models/Doctor')
const Student = require('../models/Student')

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI is not set in backend/.env')
    process.exit(1)
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  console.log('Connected to MongoDB')
  // clear appointments in doctors
  const dres = await Doctor.updateMany({}, { $set: { appointments: [] } })
  console.log('Doctors updated:', dres.modifiedCount)
  const sres = await Student.updateMany({}, { $set: { appointments: [] } })
  console.log('Students updated:', sres.modifiedCount)
  await mongoose.disconnect()
  console.log('Done')
}

main().catch(err => { console.error(err); process.exit(1) })
