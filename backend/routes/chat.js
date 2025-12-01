const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const ChatMessage = require('../models/ChatMessage')
const Student = require('../models/Student')
const Doctor = require('../models/Doctor')

// Get chat history for an appointment
router.get('/appointment/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    // Verify user has access to this appointment
    if (userRole === 'student') {
      const student = await Student.findOne({ id: userId }).lean().exec()
      if (!student) return res.status(404).json({ error: 'Student not found' })
      
      // Students can access by doctorId or appointmentId
      let hasAccess = student.appointments.some(apt => 
        apt.doctorId === appointmentId || appointmentId.includes(apt.doctorId)
      )
      
      // If not found, check if appointmentId is an actual appointmentId
      if (!hasAccess) {
        const doctor = await Doctor.findOne({ 
          'appointments.appointmentId': appointmentId,
          'appointments.bookedByStudentId': userId 
        }).lean().exec()
        hasAccess = !!doctor
      }
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this chat' })
      }
    } else if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ id: userId }).lean().exec()
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
      
      // Check if appointment exists in doctor's appointments
      const hasAppointment = doctor.appointments.some(apt => 
        (apt.appointmentId && apt.appointmentId === appointmentId) ||
        (apt._id && apt._id.toString() === appointmentId)
      )
      if (!hasAppointment && appointmentId !== userId) {
        return res.status(403).json({ error: 'Access denied to this chat' })
      }
    }

    // Fetch chat messages
    const messages = await ChatMessage.find({ appointmentId })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean()
      .exec()

    res.json({ messages })
  } catch (err) {
    console.error('Error fetching chat messages:', err)
    res.status(500).json({ error: 'Failed to fetch chat messages' })
  }
})

// Get list of available chats for user
router.get('/rooms', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    const roomsMap = new Map() // Use Map for deduplication

    if (userRole === 'student') {
      const student = await Student.findOne({ id: userId }).lean().exec()
      if (!student) return res.status(404).json({ error: 'Student not found' })
      
      // Get all appointments with doctors
      for (const apt of student.appointments) {
        const doctor = await Doctor.findOne({ id: apt.doctorId }).lean().exec()
        if (doctor && !roomsMap.has(apt.doctorId)) {
          roomsMap.set(apt.doctorId, {
            appointmentId: apt.doctorId,
            doctorName: doctor.name || 'Unknown Doctor',
            doctorId: apt.doctorId,
            appointmentDate: apt.start
          })
        }
      }
    } else if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ id: userId }).lean().exec()
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
      
      // Get all appointments with students - use Map for deduplication
      const studentIdsSet = new Set(doctor.appointments.map(apt => apt.studentId).filter(Boolean))
      for (const studentId of studentIdsSet) {
        const student = await Student.findOne({ id: studentId }).lean().exec()
        if (student && !roomsMap.has(studentId)) {
          roomsMap.set(studentId, {
            appointmentId: userId,
            studentName: 'Student',
            studentId: studentId
          })
        }
      }
    }

    res.json({ rooms: Array.from(roomsMap.values()) })
  } catch (err) {
    console.error('Error fetching chat rooms:', err)
    res.status(500).json({ error: 'Failed to fetch chat rooms' })
  }
})

module.exports = router
