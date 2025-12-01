const request = require('supertest')
const mongoose = require('mongoose')
const { app, connectDB, stopDB } = require('../index')
const Student = require('../models/Student')
const Doctor = require('../models/Doctor')
const User = require('../models/User')
const ChatMessage = require('../models/ChatMessage')
const jwt = require('jsonwebtoken')
const { encryptMessage, decryptMessage } = require('../utils/encryption')

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'

describe('Chatroom Features - Comprehensive Tests', () => {
  let studentToken, doctorToken, studentId, doctorId, appointmentId

  beforeAll(async () => {
    await connectDB()
    
    // Create test users
    appointmentId = `apt-${Date.now()}`

    // Create student user with required fields
    const studentUser = await User.create({
      email: `student-${Date.now()}@test.com`,
      passwordHash: 'hashed_password_123',
      fullName: 'Test Student',
      role: 'student'
    })
    studentId = studentUser.id

    // Create doctor user with required fields
    const doctorUser = await User.create({
      email: `doctor-${Date.now()}@test.com`,
      passwordHash: 'hashed_password_456',
      fullName: 'Test Doctor',
      role: 'doctor'
    })
    doctorId = doctorUser.id

    // Create student profile
    await Student.create({
      id: studentId,
      appointments: [{
        doctorId: doctorId,
        start: new Date(),
        appointmentId: appointmentId
      }]
    })

    // Create doctor profile with required fields
    await Doctor.create({
      id: doctorId,
      doctorName: 'Dr. Test Doctor',
      clinicName: 'Test Clinic',
      address: '123 Test St',
      appointments: [{
        studentId: studentId,
        start: new Date(),
        appointmentId: appointmentId,
        bookedByStudentId: studentId
      }]
    })

    // Generate tokens
    studentToken = jwt.sign({ id: studentId, role: 'student' }, JWT_SECRET)
    doctorToken = jwt.sign({ id: doctorId, role: 'doctor' }, JWT_SECRET)
  }, 30000)

  afterAll(async () => {
    // Cleanup
    await Student.deleteMany({ id: { $in: [studentId] } })
    await Doctor.deleteMany({ id: { $in: [doctorId] } })
    await User.deleteMany({ email: { $regex: /test\.com$/ } })
    await ChatMessage.deleteMany({ appointmentId })
    await stopDB()
  }, 30000)

  describe('Chat Rooms Endpoint - /api/chat/rooms', () => {
    test('Student can fetch available chat rooms', async () => {
      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(res.body).toHaveProperty('rooms')
      expect(Array.isArray(res.body.rooms)).toBe(true)
      expect(res.body.rooms.length).toBeGreaterThan(0)
      expect(res.body.rooms[0]).toHaveProperty('doctorId', doctorId)
    })

    test('Doctor can fetch available chat rooms', async () => {
      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200)

      expect(res.body).toHaveProperty('rooms')
      expect(Array.isArray(res.body.rooms)).toBe(true)
      expect(res.body.rooms.length).toBeGreaterThan(0)
      expect(res.body.rooms[0]).toHaveProperty('studentId', studentId)
    })

    test('Rooms endpoint prevents duplicate entries', async () => {
      // Add duplicate appointment to student
      await Student.updateOne(
        { id: studentId },
        {
          $push: {
            appointments: {
              doctorId: doctorId,
              start: new Date(),
              appointmentId: `${appointmentId}-dup`
            }
          }
        }
      )

      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      // Should only return one room per doctor despite duplicate appointments
      const doctorRooms = res.body.rooms.filter(r => r.doctorId === doctorId)
      expect(doctorRooms.length).toBe(1)

      // Cleanup
      await Student.updateOne(
        { id: studentId },
        { $pull: { appointments: { appointmentId: `${appointmentId}-dup` } } }
      )
    })

    test('Unauthorized access returns 401', async () => {
      await request(app)
        .get('/api/chat/rooms')
        .expect(401)
    })
  })

  describe('Chat History Endpoint - /api/chat/appointment/:appointmentId', () => {
    beforeEach(async () => {
      // Clear any existing messages
      await ChatMessage.deleteMany({ appointmentId })
    })

    test('Student can fetch chat history for their appointment', async () => {
      // Create test message
      const message = new ChatMessage({
        appointmentId,
        senderId: studentId,
        senderRole: 'student',
        message: 'Test message'
      })
      await message.save()

      const res = await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(res.body).toHaveProperty('messages')
      expect(Array.isArray(res.body.messages)).toBe(true)
      expect(res.body.messages.length).toBe(1)
      expect(res.body.messages[0].senderId).toBe(studentId)
    })

    test('Doctor can fetch chat history for their appointment', async () => {
      // Create test message
      const message = new ChatMessage({
        appointmentId,
        senderId: doctorId,
        senderRole: 'doctor',
        message: 'Doctor response'
      })
      await message.save()

      const res = await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200)

      expect(res.body).toHaveProperty('messages')
      expect(res.body.messages.length).toBeGreaterThan(0)
    })

    test('Student cannot access other appointments', async () => {
      const unauthorizedAppointmentId = 'unauthorized-apt'

      await request(app)
        .get(`/api/chat/appointment/${unauthorizedAppointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)
    })

    test('Doctor cannot access unrelated appointments', async () => {
      const unauthorizedAppointmentId = 'unauthorized-apt'

      await request(app)
        .get(`/api/chat/appointment/${unauthorizedAppointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403)
    })

    test('Messages are automatically decrypted on retrieval', async () => {
      const plaintext = 'This should be encrypted in DB'
      const message = new ChatMessage({
        appointmentId,
        senderId: studentId,
        senderRole: 'student',
        message: plaintext
      })
      await message.save()

      const res = await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      const retrievedMessage = res.body.messages.find(m => m.senderId === studentId)
      expect(retrievedMessage.message).toBe(plaintext)
    })
  })

  describe('Database Encryption', () => {
    test('Messages are encrypted in database', async () => {
      const plaintext = 'Secret message content'
      const chatMessage = new ChatMessage({
        appointmentId,
        senderId: studentId,
        senderRole: 'student',
        message: plaintext
      })
      await chatMessage.save()

      // Fetch directly from DB bypassing Mongoose hooks
      const rawDoc = await mongoose.connection.collection('chatmessages').findOne({
        _id: chatMessage._id
      })

      // Should be encrypted (not plaintext)
      expect(rawDoc.message).not.toBe(plaintext)
      expect(rawDoc.message).toMatch(/^[A-Za-z0-9+/]+=*$/) // Base64 format
    })

    test('Encryption utilities work correctly', async () => {
      const plaintext = 'Test encryption'
      const encrypted = await encryptMessage(plaintext)
      
      expect(encrypted).not.toBe(plaintext)
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/)

      const decrypted = await decryptMessage(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    test('Failed decryption returns error message', async () => {
      const invalidCiphertext = 'InvalidBase64Data!!!'
      const result = await decryptMessage(invalidCiphertext)
      
      expect(result).toMatch(/\[Encrypted message - decryption failed\]/)
    })
  })

  describe('Access Control & Authorization', () => {
    test('Missing token returns 401', async () => {
      await request(app)
        .get('/api/chat/rooms')
        .expect(401)
    })

    test('Invalid token returns 401', async () => {
      await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401)
    })

    test('Student can access by doctorId', async () => {
      const res = await request(app)
        .get(`/api/chat/appointment/${doctorId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(res.body).toHaveProperty('messages')
    })

    test('Cross-role access is prevented', async () => {
      // Create another student with no relation
      const otherStudentId = `other-student-${Date.now()}`
      const otherStudent = new Student({
        id: otherStudentId,
        appointments: []
      })
      await otherStudent.save()

      const otherToken = jwt.sign({ id: otherStudentId, role: 'student' }, JWT_SECRET)

      await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403)

      // Cleanup
      await Student.deleteOne({ id: otherStudentId })
    })
  })

  describe('Edge Cases & Error Handling', () => {
    test('Handles non-existent appointment gracefully', async () => {
      const res = await request(app)
        .get('/api/chat/appointment/non-existent-apt-12345')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)

      expect(res.body).toHaveProperty('error')
    })

    test('Returns empty array for appointment with no messages', async () => {
      const emptyAppointmentId = `empty-apt-${Date.now()}`
      
      // Add appointment to student
      await Student.updateOne(
        { id: studentId },
        {
          $push: {
            appointments: {
              doctorId: doctorId,
              start: new Date(),
              appointmentId: emptyAppointmentId
            }
          }
        }
      )

      const res = await request(app)
        .get(`/api/chat/appointment/${emptyAppointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(res.body.messages).toEqual([])

      // Cleanup
      await Student.updateOne(
        { id: studentId },
        { $pull: { appointments: { appointmentId: emptyAppointmentId } } }
      )
    })

    test('Handles deleted student profile', async () => {
      const tempStudentId = `temp-student-${Date.now()}`
      const tempToken = jwt.sign({ id: tempStudentId, role: 'student' }, JWT_SECRET)

      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(404)

      expect(res.body.error).toContain('Student not found')
    })

    test('Handles deleted doctor profile', async () => {
      const tempDoctorId = `temp-doctor-${Date.now()}`
      const tempToken = jwt.sign({ id: tempDoctorId, role: 'doctor' }, JWT_SECRET)

      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(404)

      expect(res.body.error).toContain('Doctor not found')
    })

    test('Limits message history to 100 messages', async () => {
      // Create 105 messages
      const messages = []
      for (let i = 0; i < 105; i++) {
        messages.push({
          appointmentId,
          senderId: studentId,
          senderRole: 'student',
          message: `Message ${i}`
        })
      }
      await ChatMessage.insertMany(messages)

      const res = await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      // Should only return 100 messages
      expect(res.body.messages.length).toBe(100)
    })
  })
})
