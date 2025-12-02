const express = require('express')
const router = express.Router()

// returns a fresh seed token for development only
router.get('/seed-token', async (req, res) => {
  if ((process.env.NODE_ENV || 'development') === 'production') return res.status(404).json({ error: 'Not found' })
  try {
    const jwt = require('jsonwebtoken')
    const payload = {
      sub: process.env.DEV_SEED_SUB || 'e3805ad0-11d3-4af8-be26-834eae3aed98',
      email: process.env.DEV_SEED_EMAIL || 'doctor@email.com',
      role: process.env.DEV_SEED_ROLE || 'doctor',
      profileId: process.env.DEV_SEED_PROFILEID || 'fe3b7be3-c4f5-482b-b647-3a400b3c3259'
    }
    const secret = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'
    const token = jwt.sign(payload, secret, { expiresIn: process.env.DEV_SEED_EXPIRES || '30d' })
    // Ensure a matching User exists in DB for dev token to allow role checks
    try {
      const User = require('../models/User')
      // upsert the user lightweight record
      await User.updateOne({ id: payload.sub }, { $set: { id: payload.sub, email: payload.email, role: payload.role, profileId: payload.profileId, fullName: 'Dev User', passwordHash: 'dev-placeholder' } }, { upsert: true }).exec()
      // Ensure a matching profile document exists depending on role
      if (payload.role === 'student') {
        try {
          const Student = require('../models/Student')
          const existing = await Student.findOne({ id: payload.profileId }).exec()
          if (!existing) {
            const s = new Student({ id: payload.profileId, address: 'Dev Address' })
            await s.save()
          }
        } catch (e) {
          console.warn('dev seed: failed to ensure Student profile', e && e.message)
        }
      } else if (payload.role === 'doctor') {
        try {
          const Doctor = require('../models/Doctor')
          const existingD = await Doctor.findOne({ id: payload.profileId }).exec()
          if (!existingD) {
            const d = new Doctor({ id: payload.profileId, clinicName: 'Dev Clinic', address: 'Dev Address', doctorName: 'Dev Doctor' })
            await d.save()
          }
        } catch (e) {
          console.warn('dev seed: failed to ensure Doctor profile', e && e.message)
        }
      }
    } catch (e) {
      console.warn('dev seed: failed to upsert user', e && e.message)
    }
    res.json({ token, user: { id: payload.sub, email: payload.email, role: payload.role, profileId: payload.profileId } })
  } catch (err) {
    console.warn('dev seed error', err && err.message)
    res.status(500).json({ error: 'Failed to generate seed token' })
  }
})

// Dev-only: create a doctor document (for testing). Body: { id, clinicName, address, doctorName, location: { coordinates: [lng, lat] } }
router.post('/create-doctor', async (req, res) => {
  if ((process.env.NODE_ENV || 'development') === 'production') return res.status(404).json({ error: 'Not found' })
  try {
    const Doctor = require('../models/Doctor')
    const { id, clinicName, address, doctorName, location } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id required' })
    const doc = new Doctor({ id, clinicName: clinicName || 'Dev Clinic', address: address || 'Dev Address', doctorName: doctorName || 'Dev Doctor' })
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      const lng = parseFloat(location.coordinates[0])
      const lat = parseFloat(location.coordinates[1])
      if (isFinite(lng) && isFinite(lat)) doc.location = { type: 'Point', coordinates: [lng, lat] }
    }
    await doc.save()
    return res.json({ ok: true, doctorId: doc.id })
  } catch (err) {
    console.warn('dev create-doctor error', err && err.message)
    return res.status(500).json({ error: 'Failed to create doctor' })
  }
})

module.exports = router
