const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// GET /api/chat/rooms
// Return list of room IDs the authenticated user can join
router.get('/rooms', auth, async (req, res) => {
  try {
    const User = require('../models/User')
    const Student = require('../models/Student')
    const Doctor = require('../models/Doctor')

    const user = await User.findOne({ id: req.user.id }).lean().exec()
    if (!user) return res.status(404).json({ error: 'User not found' })

    const rooms = []
    if (user.role === 'student' && user.profileId) {
      const student = await Student.findOne({ id: user.profileId }).lean().exec()
      if (student && Array.isArray(student.appointments)) {
        for (const a of student.appointments) {
          if (a.doctorId) {
            const doctorDoc = await Doctor.findOne({ id: a.doctorId }).lean().exec()
            const doctorName = doctorDoc ? (doctorDoc.doctorName || doctorDoc.clinicName) : a.doctorId
            // attempt to resolve student user fullName
            const studentUser = await User.findOne({ profileId: student.id }).lean().exec()
            const studentName = studentUser ? (studentUser.fullName || studentUser.email) : student.id
            rooms.push({ id: `appt:${a.doctorId}:${student.id}`, doctorId: a.doctorId, studentId: student.id, doctorName, studentName })
          }
        }
      }
    }
    if (user.role === 'doctor' && user.profileId) {
      const doctor = await Doctor.findOne({ id: user.profileId }).lean().exec()
      if (doctor && Array.isArray(doctor.appointments)) {
        for (const a of doctor.appointments) {
          if (a.bookedByStudentId) {
            const studentUser = await User.findOne({ profileId: a.bookedByStudentId }).lean().exec()
            const studentName = studentUser ? (studentUser.fullName || studentUser.email) : a.bookedByStudentId
            const doctorName = doctor ? (doctor.doctorName || doctor.clinicName) : doctor.id
            rooms.push({ id: `appt:${doctor.id}:${a.bookedByStudentId}`, doctorId: doctor.id, studentId: a.bookedByStudentId, doctorName, studentName })
          }
        }
      }
    }

    // deduplicate rooms by id (a user may have multiple appointments with the same doctor)
    const { dedupeRooms } = require('../lib/dedupeRooms')
    const uniqueRooms = dedupeRooms(rooms)
    res.json({ rooms: uniqueRooms })
  } catch (err) {
    console.error('Chat rooms error', err)
    res.status(500).json({ error: 'Failed to fetch chat rooms' })
  }
})

// GET /api/chat/rooms/:roomId - return room metadata (doctor/student names)
router.get('/rooms/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params
    if (!roomId) return res.status(400).json({ error: 'roomId required' })
    // roomId format: appt:doctorId:studentId
    const parts = roomId.split(':')
    if (parts.length !== 3 || parts[0] !== 'appt') return res.status(400).json({ error: 'invalid roomId' })
    const doctorId = parts[1]
    const studentId = parts[2]
    const Doctor = require('../models/Doctor')
    const User = require('../models/User')
    const doctorDoc = await Doctor.findOne({ id: doctorId }).lean().exec()
    const doctorName = doctorDoc ? (doctorDoc.doctorName || doctorDoc.clinicName) : doctorId
    const studentUser = await User.findOne({ profileId: studentId }).lean().exec()
    const studentName = studentUser ? (studentUser.fullName || studentUser.email) : studentId
    res.json({ room: { id: roomId, doctorId, studentId, doctorName, studentName } })
  } catch (err) {
    console.error('Chat room meta error', err)
    res.status(500).json({ error: 'Failed to fetch room metadata' })
  }
})

const Message = require('../models/Message')

// GET /api/chat/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params
    const msgs = await Message.find({ roomId }).sort({ ts: 1 }).limit(200).lean().exec()
    res.json({ messages: msgs })
  } catch (err) {
    console.error('Chat history error', err)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// POST /api/chat/messages
// Persist a chat message (expects authenticated user)
router.post('/messages', auth, async (req, res) => {
  try {
    const { roomId, text, ts } = req.body || {}
    if (!roomId || !text) return res.status(400).json({ error: 'roomId and text required' })
    const msg = new Message({ roomId, text: String(text), ts: ts ? new Date(ts) : new Date(), senderId: req.user.id, senderName: req.user.fullName || req.user.email, senderRole: req.user.role })
    await msg.save()
    res.json({ ok: true, message: msg })
  } catch (err) {
    console.error('Persist message error', err)
    res.status(500).json({ error: 'Failed to persist message' })
  }
})

module.exports = router
