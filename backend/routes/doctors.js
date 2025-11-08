const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const Doctor = require('../models/Doctor')

// GET /api/doctors/:doctorId - return doctor clinic info + appointments metadata
router.get('/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params
    const doc = await Doctor.findOne({ id: doctorId }).lean().exec()
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })
    // send basic clinic info and appointments count
    const safe = {
      id: doc.id,
      clinicName: doc.clinicName,
      address: doc.address,
      location: doc.location,
      doctorName: doc.doctorName,
      appointmentsCount: (doc.appointments || []).length
    }
    res.json(safe)
  } catch (err) {
    console.error('Get doctor error', err)
    res.status(500).json({ error: 'Failed to fetch doctor' })
  }
})

// PATCH /api/doctors/:doctorId - update clinicName/address/location
router.patch('/:doctorId', auth, requireRole('doctor'), async (req, res) => {
  try {
    const { doctorId } = req.params
    const { clinicName, address, location } = req.body
    const update = {}
    if (clinicName !== undefined) update.clinicName = clinicName
    if (address !== undefined) update.address = address
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      update.location = { type: 'Point', coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])] }
    }
    const doc = await Doctor.findOneAndUpdate({ id: doctorId }, { $set: update }, { new: true }).lean().exec()
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })
    res.json({ ok: true, doctor: { id: doc.id, clinicName: doc.clinicName, address: doc.address, location: doc.location } })
  } catch (err) {
    console.error('Update doctor error', err)
    res.status(500).json({ error: 'Failed to update doctor' })
  }
})

module.exports = router
