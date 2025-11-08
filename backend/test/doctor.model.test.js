const mongoose = require('mongoose')
const { connectDB } = require('../index')

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) await connectDB()
})

afterAll(async () => {
  await mongoose.disconnect()
})

test('Doctor model persists clinic-level location', async () => {
  const Doctor = require('../models/Doctor')
  // create a doctor
  const doc = await Doctor.create({ clinicName: 'Test Clinic', address: '123 Test St', doctorName: 'Dr Test' })
  expect(doc).toBeTruthy()
  // update location
  const loc = { type: 'Point', coordinates: [-122.42, 37.78] }
  const updated = await Doctor.findOneAndUpdate({ id: doc.id }, { $set: { location: loc } }, { new: true }).lean().exec()
  expect(updated).toBeTruthy()
  expect(updated.location).toBeDefined()
  expect(Array.isArray(updated.location.coordinates)).toBeTruthy()
  expect(updated.location.coordinates[0]).toBeCloseTo(-122.42, 5)
  expect(updated.location.coordinates[1]).toBeCloseTo(37.78, 5)
})
