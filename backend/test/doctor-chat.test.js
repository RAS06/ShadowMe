const request = require('supertest')
const { app, connectDB, stopDB } = require('../index')
const User = require('../models/User')
const Student = require('../models/Student')
const Doctor = require('../models/Doctor')
const ChatMessage = require('../models/ChatMessage')
const jwt = require('jsonwebtoken')

describe('Doctor Chat Access', () => {
  let doctorToken, studentToken, doctorId, studentId, appointmentId

  beforeAll(async () => {
    await connectDB()
    
    // Create test doctor
    const doctor = await User.create({
      email: 'doctor-chat2@test.com',
      passwordHash: 'hash',
      role: 'doctor',
      fullName: 'Dr. Chat Test'
    })
    doctorId = doctor.id

    // Create test student
    const student = await User.create({
      email: 'student-chat2@test.com',
      passwordHash: 'hash',
      role: 'student',
      fullName: 'Student Chat Test'
    })
    studentId = student.id

    // Create doctor profile with appointment
    const doctorProfile = await Doctor.create({
      id: doctorId,
      doctorName: 'Dr. Chat Test',
      clinicName: 'Test Clinic',
      address: '123 Test St',
      appointments: [{
        start: new Date(),
        end: new Date(),
        isBooked: true,
        bookedByStudentId: studentId
      }]
    })
    appointmentId = doctorProfile.appointments[0].appointmentId

    // Create student profile
    await Student.create({
      id: studentId,
      appointments: [{
        doctorId: doctorId,
        start: new Date(),
        end: new Date()
      }]
    })

    // Generate tokens
    const secret = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'
    doctorToken = jwt.sign({ sub: doctorId, role: 'doctor', email: doctor.email }, secret)
    studentToken = jwt.sign({ sub: studentId, role: 'student', email: student.email }, secret)
  })

  afterAll(async () => {
    await ChatMessage.deleteMany({})
    await Student.deleteMany({})
    await Doctor.deleteMany({})
    await User.deleteMany({})
    await stopDB()
  })

  describe('Doctor accessing chat rooms', () => {
    it('should allow doctor to fetch their chat rooms', async () => {
      const res = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200)

      expect(res.body.rooms).toBeDefined()
      expect(Array.isArray(res.body.rooms)).toBe(true)
    })

    it('should allow doctor to access appointment chat history', async () => {
      // Create a test message in the appointment chat
      await ChatMessage.create({
        appointmentId: appointmentId,
        senderId: studentId,
        senderRole: 'student',
        message: 'Hello doctor, I have a question!'
      })

      const res = await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200)

      expect(res.body.messages).toBeDefined()
      expect(res.body.messages.length).toBeGreaterThan(0)
      expect(res.body.messages[0].message).toBe('Hello doctor, I have a question!')
    })

    it('should allow student to access the same chat', async () => {
      const res = await request(app)
        .get(`/api/chat/appointment/${doctorId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(res.body.messages).toBeDefined()
      expect(Array.isArray(res.body.messages)).toBe(true)
    })

    it('should prevent unauthorized access to chat', async () => {
      await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .expect(401)
    })
  })

  describe('Bidirectional chat communication', () => {
    it('should allow both doctor and student to see messages', async () => {
      // Doctor sends a message
      await ChatMessage.create({
        appointmentId: appointmentId,
        senderId: doctorId,
        senderRole: 'doctor',
        message: 'Hello, I received your question.'
      })

      // Both should be able to see all messages
      const doctorRes = await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200)

      const studentRes = await request(app)
        .get(`/api/chat/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(doctorRes.body.messages.length).toBeGreaterThan(1)
      expect(studentRes.body.messages.length).toBeGreaterThan(0)
    })
  })
})
