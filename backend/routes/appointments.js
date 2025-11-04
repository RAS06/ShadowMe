const express = require('express')
const router = express.Router()
const Doctor = require('../models/Doctor')
const Student = require('../models/Student')
const auth = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')

// Create a new appointment opening (Doctor only)
router.post('/doctor/:doctorId/openings', auth, requireRole('doctor'), async (req, res) => {
  try {
    // In a real app, you'd verify req.user is the doctor; here we assume role is checked elsewhere
    const { doctorId } = req.params
  const { start, end, location } = req.body
    if (!start) return res.status(400).json({ error: 'start is required' })
    // validate optional location object
    if (location) {
      if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({ error: 'location must include coordinates [lng, lat]' })
      }
      const lng = parseFloat(location.coordinates[0])
      const lat = parseFloat(location.coordinates[1])
      if (!isFinite(lng) || !isFinite(lat)) return res.status(400).json({ error: 'location coordinates must be numbers' })
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ error: 'location coordinates out of range' })
    }
    const doc = await Doctor.findOne({ id: doctorId })
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })
  const appt = { start: new Date(start), end: end ? new Date(end) : undefined }
  if (location && location.coordinates && Array.isArray(location.coordinates)) {
    appt.location = { type: 'Point', coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])] }
  }
  doc.appointments.push(appt)
    await doc.save()
    res.json({ ok: true, appointments: doc.appointments })
  } catch (err) {
    console.error('Create opening error', err)
    res.status(500).json({ error: 'Failed to create opening' })
  }
})

// List nearby doctor openings for students by lat/lng and radius (meters)
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' })
    const point = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
    // Search appointments by their location
    const docs = await Doctor.find({
      'appointments.location': {
        $near: {
          $geometry: point,
          $maxDistance: parseInt(radius, 10)
        }
      }
    }).lean().exec()

    // filter to only include available openings (not booked)
    // map each doctor to include appointment locations; include only openings matching proximity
    const result = docs.map(d => ({
      id: d.id,
      clinicName: d.clinicName,
      address: d.address,
      doctorName: d.doctorName,
      // doctor-level location omitted (we moved locations to appointments), include null or aggregated if desired
      location: null,
      openings: (d.appointments || []).filter(a => !a.isBooked)
    }))
    res.json(result)
  } catch (err) {
    console.error('Nearby error', err)
    res.status(500).json({ error: 'Failed to fetch nearby openings' })
  }
})

// Student books an opening
router.post('/book/:doctorId', auth, requireRole('student'), async (req, res) => {
  try {
  const { doctorId } = req.params
  const { start } = req.body
  let { studentId } = req.body
  // If studentId not provided, try to derive from authenticated user's profileId
  if (!studentId && req.user && req.user.profileId) studentId = req.user.profileId
  if (!studentId) return res.status(400).json({ error: 'studentId required' })
  // validate student exists
  const studentRecord = await Student.findOne({ id: studentId })
  if (!studentRecord) return res.status(404).json({ error: 'Student not found' })
    // atomic update: find doctor with matching unbooked appointment and set it booked
    const doc = await Doctor.findOne({ id: doctorId })
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })
    let idx = -1
    if (req.body.appointmentId) {
      idx = doc.appointments.findIndex(a => a.appointmentId === req.body.appointmentId && !a.isBooked)
    } else {
      const startIso = new Date(start).toISOString()
      idx = doc.appointments.findIndex(a => new Date(a.start).toISOString() === startIso && !a.isBooked)
    }
    if (idx === -1) return res.status(404).json({ error: 'Opening not found or already booked' })

    // Use positional index update to set slot as booked
  const update = { $set: {} }
  update.$set[`appointments.${idx}.isBooked`] = true
  update.$set[`appointments.${idx}.bookedByStudentId`] = studentId

    const updated = await Doctor.findOneAndUpdate({ id: doctorId }, update, { new: true }).lean().exec()
  const slot = updated.appointments[idx]

    // also add to student's appointments
    const student = await Student.findOne({ id: studentId })
    if (student) {
      const studAppt = { doctorId: doc.id, start: slot.start, end: slot.end }
      if (slot.location) studAppt.location = slot.location
      student.appointments.push(studAppt)
      await student.save()
    }

    res.json({ ok: true, slot })
  } catch (err) {
    console.error('Book error', err)
    res.status(500).json({ error: 'Failed to book opening' })
  }
})

// Doctor can list their appointments
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params
    const doc = await Doctor.findOne({ id: doctorId }).lean().exec()
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })
    res.json({ appointments: doc.appointments })
  } catch (err) {
    console.error('Doctor list error', err)
    res.status(500).json({ error: 'Failed to fetch doctor appointments' })
  }
})

// Doctor cancels an opening (must be unbooked)
router.delete('/doctor/:doctorId/openings', auth, requireRole('doctor'), async (req, res) => {
  try {
    const { doctorId } = req.params
    const { start, appointmentId } = req.body
    if (!start && !appointmentId) return res.status(400).json({ error: 'start or appointmentId is required' })
    const doc = await Doctor.findOne({ id: doctorId })
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })
    let idx = -1
    if (req.body.appointmentId) {
      idx = doc.appointments.findIndex(a => a.appointmentId === req.body.appointmentId && !a.isBooked)
    } else {
      const startIso = new Date(start).toISOString()
      idx = doc.appointments.findIndex(a => new Date(a.start).toISOString() === startIso && !a.isBooked)
    }
    if (idx === -1) return res.status(404).json({ error: 'Opening not found or already booked' })
    doc.appointments.splice(idx, 1)
    await doc.save()
    res.json({ ok: true, appointments: doc.appointments })
  } catch (err) {
    console.error('Cancel opening error', err)
    res.status(500).json({ error: 'Failed to cancel opening' })
  }
})

// Doctor marks a booked appointment as completed
router.post('/doctor/:doctorId/complete', auth, requireRole('doctor'), async (req, res) => {
  console.log('Complete endpoint hit. auth header:', req.headers.authorization && req.headers.authorization.slice(0,40))
  console.log('Complete endpoint req.user:', req.user)
  try {
    const { doctorId } = req.params
    const { start, appointmentId } = req.body
    if (!start && !appointmentId) return res.status(400).json({ error: 'start or appointmentId is required' })
    const doc = await Doctor.findOne({ id: doctorId })
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })
    let idx = -1
    if (req.body.appointmentId) {
      idx = doc.appointments.findIndex(a => a.appointmentId === req.body.appointmentId && a.isBooked)
    } else {
      const startIso = new Date(start).toISOString()
      idx = doc.appointments.findIndex(a => new Date(a.start).toISOString() === startIso && a.isBooked)
    }
    if (idx === -1) return res.status(404).json({ error: 'Booked appointment not found' })
    // set completed flag
    doc.appointments[idx].isCompleted = true
    await doc.save()
    res.json({ ok: true, appointment: doc.appointments[idx] })
  } catch (err) {
    console.error('Complete appointment error', err)
    res.status(500).json({ error: 'Failed to mark appointment completed' })
  }
})

module.exports = router
