const request = require('supertest')
const mongoose = require('mongoose')
const { app, connectDB } = require('../index')

function uniqueEmail() {
  return `appttest_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
}

describe('Appointments API', () => {
  let doctorUser, studentUser, doctorToken, studentToken, doctorProfileId, studentProfileId
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) await connectDB()
  })

  afterAll(async () => {
    // cleanup test users and profiles
    const User = mongoose.model('User')
    const Doctor = mongoose.model('Doctor')
    const Student = mongoose.model('Student')
    await User.deleteMany({ email: /testuser_/ })
    await Doctor.deleteMany({ clinicName: /Test Clinic/ })
    await Student.deleteMany({})
    await mongoose.disconnect()
  })

  it('doctor registers and creates opening, student books it', async () => {
    // register a normal user who will become doctor after admin promotion
    const docEmail = uniqueEmail()
    const docRes = await request(app)
      .post('/api/auth/register')
      .send({ email: docEmail, password: 'Testpass!@12', fullName: 'Dr Test', profile: { address: 'N/A' } })
    expect(docRes.statusCode).toBe(200)
    const docUserId = docRes.body.user.id

    // create admin user
    const adminEmail = uniqueEmail()
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ email: adminEmail, password: 'Testpass!@12', fullName: 'Admin User', profile: { address: 'N/A' } })
    expect(adminRes.statusCode).toBe(200)
    const adminToken = adminRes.body.token
    const adminId = adminRes.body.user.id

    // directly update admin to have role 'admin' in DB for test purposes
    const User = require('mongoose').model('User')
    await User.updateOne({ id: adminId }, { $set: { role: 'admin' } })

    // promote the doc user to doctor via admin endpoint
    const promoteRes = await request(app)
      .post('/api/admin/promote')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: docUserId, clinicName: 'Test Clinic', address: '123 Main St', location: { coordinates: [ -122.4194, 37.7749 ] } })
    expect(promoteRes.statusCode).toBe(200)
    doctorProfileId = promoteRes.body.doctorId

  // use token returned by promote endpoint to act as doctor
  doctorToken = promoteRes.body.token

    // doctor creates an opening
    const start = new Date(Date.now() + 24*60*60*1000).toISOString()
    const createRes = await request(app)
      .post(`/api/appointments/doctor/${doctorProfileId}/openings`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ start })
    expect(createRes.statusCode).toBe(200)
    const createdAppointments = createRes.body.appointments || createRes.body.appointments
    // ensure appointmentId exists on the created appointment
    const created = createdAppointments.find(a => new Date(a.start).toISOString() === new Date(start).toISOString())
    expect(created).toBeDefined()
    expect(created.appointmentId).toBeDefined()

    // register student
    const stuEmail = uniqueEmail()
    const stuRes = await request(app)
      .post('/api/auth/register')
      .send({ email: stuEmail, password: 'Testpass!@12', fullName: 'Student Test', role: 'student', profile: { address: 'Somewhere', location: { coordinates: [ -122.4194, 37.7749 ] } } })
    expect(stuRes.statusCode).toBe(200)
    studentToken = stuRes.body.token
    studentProfileId = stuRes.body.user.profileId

    // student lists nearby
    const nearbyRes = await request(app)
      .get('/api/appointments/nearby')
      .query({ lat: 37.7749, lng: -122.4194, radius: 5000 })
      .set('Authorization', `Bearer ${studentToken}`)
    expect(nearbyRes.statusCode).toBe(200)
    expect(Array.isArray(nearbyRes.body)).toBe(true)
    const doctor = nearbyRes.body.find(d => d.id === doctorProfileId)
    expect(doctor).toBeDefined()
    expect(doctor.openings.length).toBeGreaterThan(0)

    // student books the opening
    const bookRes = await request(app)
      .post(`/api/appointments/book/${doctorProfileId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ start, studentId: studentProfileId })
    expect(bookRes.statusCode).toBe(200)
    expect(bookRes.body.ok).toBe(true)
    expect(bookRes.body.slot.isBooked).toBe(true)

    // doctor marks it completed by appointmentId
    const apptId = bookRes.body.slot.appointmentId
    const completeRes = await request(app)
      .post(`/api/appointments/doctor/${doctorProfileId}/complete`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ appointmentId: apptId })
    expect(completeRes.statusCode).toBe(200)
    expect(completeRes.body.ok).toBe(true)
    expect(completeRes.body.appointment.isCompleted).toBe(true)

    // doctor cancels a different opening (create then cancel)
    const start2 = new Date(Date.now() + 48*60*60*1000).toISOString()
    const createRes2 = await request(app)
      .post(`/api/appointments/doctor/${doctorProfileId}/openings`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ start: start2 })
    expect(createRes2.statusCode).toBe(200)
    const created2 = (createRes2.body.appointments || []).find(a => new Date(a.start).toISOString() === new Date(start2).toISOString())
    expect(created2).toBeDefined()
    const cancelRes = await request(app)
      .delete(`/api/appointments/doctor/${doctorProfileId}/openings`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ appointmentId: created2.appointmentId })
    expect(cancelRes.statusCode).toBe(200)
    expect(cancelRes.body.ok).toBe(true)
  })
})
