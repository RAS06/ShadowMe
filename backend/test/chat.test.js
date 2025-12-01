const request = require('supertest')
const { app, connectDB, stopDB } = require('../index')
const ChatMessage = require('../models/ChatMessage')
const User = require('../models/User')
const Student = require('../models/Student')
const Doctor = require('../models/Doctor')
const jwt = require('jsonwebtoken')

describe('Chat API', () => {
  let studentToken, doctorToken, studentId, doctorId

  beforeAll(async () => {
    await connectDB()
    
    // Create test users
    const student = await User.create({
      email: 'student-chat@test.com',
      passwordHash: 'hash',
      role: 'student',
      fullName: 'Test Student'
    })
    studentId = student.id

    const doctor = await User.create({
      email: 'doctor-chat@test.com',
      passwordHash: 'hash',
      role: 'doctor',
      fullName: 'Test Doctor'
    })
    doctorId = doctor.id

    // Create profiles
    await Student.create({
      id: studentId,
      appointments: [{
        doctorId: doctorId,
        start: new Date(),
        end: new Date()
      }]
    })

    await Doctor.create({
      id: doctorId,
      name: 'Dr. Test',
      doctorName: 'Dr. Test',
      clinicName: 'Test Clinic',
      address: '123 Test St',
      appointments: [{
        studentId: studentId,
        start: new Date(),
        end: new Date()
      }]
    })

    // Generate tokens
    const secret = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'
    studentToken = jwt.sign({ sub: studentId, role: 'student', email: student.email }, secret)
    doctorToken = jwt.sign({ sub: doctorId, role: 'doctor', email: doctor.email }, secret)
  })

  afterAll(async () => {
    await ChatMessage.deleteMany({})
    await Student.deleteMany({})
    await Doctor.deleteMany({})
    await User.deleteMany({})
    await stopDB()
  })

  describe('GET /api/chat/appointment/:appointmentId', () => {
    it('should fetch chat messages for an appointment', async () => {
      // Create a test message
      await ChatMessage.create({
        appointmentId: doctorId,
        senderId: studentId,
        senderRole: 'student',
        message: 'Hello doctor!'
      })

      const res = await request(app)
        .get(`/api/chat/appointment/${doctorId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(res.body.messages).toBeDefined()
      expect(res.body.messages.length).toBeGreaterThan(0)
      expect(res.body.messages[0].message).toBe('Hello doctor!')
    })

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/chat/appointment/${doctorId}`)
        .expect(401)
    })
  })

  describe('GET /api/chat/rooms', () => {
    it('should return available chat rooms for student', async () => {
      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(res.body.rooms).toBeDefined()
      expect(Array.isArray(res.body.rooms)).toBe(true)
    })

    it('should return available chat rooms for doctor', async () => {
      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200)

      expect(res.body.rooms).toBeDefined()
      expect(Array.isArray(res.body.rooms)).toBe(true)
    })
  })
})
