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
  const { start, end, location, address } = req.body
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
  if (address) appt.address = String(address)
  // Determine appointment location: prefer provided location, otherwise fall back to doctor's clinic location if available
  let chosenLocation
  if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    const lng = parseFloat(location.coordinates[0])
    const lat = parseFloat(location.coordinates[1])
    if (isFinite(lng) && isFinite(lat)) chosenLocation = { type: 'Point', coordinates: [lng, lat] }
  }
  // fallback to doctor's clinic location if no explicit appointment location provided
  if (!chosenLocation && doc.location && Array.isArray(doc.location.coordinates) && doc.location.coordinates.length === 2) {
    const lng = parseFloat(doc.location.coordinates[0])
    const lat = parseFloat(doc.location.coordinates[1])
    if (isFinite(lng) && isFinite(lat)) chosenLocation = { type: 'Point', coordinates: [lng, lat] }
  }
  if (chosenLocation) appt.location = chosenLocation
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
      // include address on each opening (use appointment.address when present, otherwise doctor's clinic address)
      openings: (d.appointments || []).filter(a => !a.isBooked).map(a => ({ ...a, address: a.address || d.address }))
    }))
    // resolve bookedByStudentId -> name for returned openings if any (defensive)
    const User = require('../models/User')
    for (const d of result) {
      for (const o of d.openings || []) {
        if (o.bookedByStudentId) {
          try {
            const u = await User.findOne({ profileId: o.bookedByStudentId }).lean().exec()
            if (u && u.fullName) o.bookedByName = u.fullName
            else o.bookedByName = o.bookedByStudentId
          } catch (e) {
            o.bookedByName = o.bookedByStudentId
          }
        }
      }
    }
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
    console.log('Booking request for doctorId=', doctorId, 'studentId=', studentId, 'authUser=', req.user && req.user.id)
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
      // prefer slot-specific address, otherwise use doctor's clinic address
      studAppt.address = slot.address || doc.address || undefined
      student.appointments.push(studAppt)
      await student.save()
    }

    res.json({ ok: true, slot })
  } catch (err) {
    console.error('Book error', err)
    res.status(500).json({ error: 'Failed to book opening' })
  }
})

// Student cancels a booked appointment
// Accepts DELETE /api/appointments/book/:doctorId with body { appointmentId?, start?, studentId? }
router.delete('/book/:doctorId', auth, requireRole('student'), async (req, res) => {
  try {
    const { doctorId } = req.params
    const { appointmentId, start } = req.body || {}
    let { studentId } = req.body || {}
    if (!studentId && req.user && req.user.profileId) studentId = req.user.profileId
    if (!studentId) return res.status(400).json({ error: 'studentId required' })

    const doc = await Doctor.findOne({ id: doctorId })
    if (!doc) return res.status(404).json({ error: 'Doctor not found' })

    let idx = -1
    if (appointmentId) {
      idx = doc.appointments.findIndex(a => a.appointmentId === appointmentId && a.isBooked && a.bookedByStudentId === studentId)
    } else if (start) {
      const startIso = new Date(start).toISOString()
      idx = doc.appointments.findIndex(a => new Date(a.start).toISOString() === startIso && a.isBooked && a.bookedByStudentId === studentId)
    } else {
      return res.status(400).json({ error: 'appointmentId or start required' })
    }
    if (idx === -1) return res.status(404).json({ error: 'Booked appointment not found for this student' })

    // Unset the booking on the doctor appointment
    const update = { $set: {} }
    update.$set[`appointments.${idx}.isBooked`] = false
    update.$set[`appointments.${idx}.bookedByStudentId`] = null

    const updated = await Doctor.findOneAndUpdate({ id: doctorId }, update, { new: true }).lean().exec()
    const slot = updated.appointments[idx]

    // Remove from student's appointments array (match by appointmentId or start time + doctorId)
    const student = await Student.findOne({ id: studentId })
    if (student) {
      let removeIdx = -1
      if (appointmentId) {
        removeIdx = student.appointments.findIndex(a => a.appointmentId === appointmentId || a.appointmentId === appointmentId)
      }
      if (removeIdx === -1 && start) {
        const startIso = new Date(start).toISOString()
        removeIdx = student.appointments.findIndex(a => new Date(a.start).toISOString() === startIso && a.doctorId === doctorId)
      }
      if (removeIdx !== -1) {
        student.appointments.splice(removeIdx, 1)
        await student.save()
      }
    }

    res.json({ ok: true, slot })
  } catch (err) {
    console.error('Cancel booking error', err)
    res.status(500).json({ error: 'Failed to cancel booking' })
  }
})

// Doctor can list their appointments
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { doctorId } = req.params
  const doc = await Doctor.findOne({ id: doctorId }).lean().exec()
  if (!doc) return res.status(404).json({ error: 'Doctor not found' })
    // ensure each appointment includes an address (appointment.address || doctor's clinic address)
    let appts = (doc.appointments || []).map(a => ({ ...a, address: a.address || doc.address }))
    // resolve bookedByStudentId to a readable name when possible
    const User = require('../models/User')
    for (let i = 0; i < appts.length; i++) {
      const a = appts[i]
      if (a.bookedByStudentId) {
        try {
          const u = await User.findOne({ profileId: a.bookedByStudentId }).lean().exec()
          if (u && u.fullName) a.bookedByName = u.fullName
          else a.bookedByName = a.bookedByStudentId
        } catch (e) {
          a.bookedByName = a.bookedByStudentId
        }
      }
    }
    res.json({ appointments: appts })
  } catch (err) {
    console.error('Doctor list error', err)
    res.status(500).json({ error: 'Failed to fetch doctor appointments' })
  }
})

// Student can list their booked appointments
// Route allowing client to fetch the authenticated student's appointments
// Also keep the existing /student/:studentId route for backwards compatibility
router.get('/student', auth, requireRole('student'), async (req, res) => {
  try {
    const studentId = req.user && req.user.profileId
    if (!studentId) return res.status(400).json({ error: 'Missing student profile' })
    const student = await Student.findOne({ id: studentId }).lean().exec()
    if (!student) return res.status(404).json({ error: 'Student not found' })
    // Debug: log appointments being returned
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      try {
        console.log('GET /api/appointments/student -> studentId:', studentId, 'appointments:', JSON.stringify(student.appointments || []))
      } catch (e) {
        console.log('GET /api/appointments/student -> appointments (non-serializable) for', studentId)
      }
    }
    res.json({ appointments: student.appointments || [] })
  } catch (err) {
    console.error('Student list error', err)
    res.status(500).json({ error: 'Failed to fetch student appointments' })
  }
})

router.get('/student/:studentId', auth, requireRole('student'), async (req, res) => {
  try {
    const { studentId } = req.params
    const student = await Student.findOne({ id: studentId }).lean().exec()
    if (!student) return res.status(404).json({ error: 'Student not found' })
    res.json({ appointments: student.appointments || [] })
  } catch (err) {
    console.error('Student list error', err)
    res.status(500).json({ error: 'Failed to fetch student appointments' })
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
