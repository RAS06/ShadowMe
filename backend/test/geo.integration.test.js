const request = require('supertest')
const mongoose = require('mongoose')
const { app, connectDB } = require('../index')

describe('Geo integration', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) await connectDB()
  })
  afterAll(async () => {
    // cleanup created dev doctor if present
    const Doctor = require('../models/Doctor')
    await Doctor.deleteOne({ id: 'dev-doc-integration' })
    await mongoose.disconnect()
  })

  test('create doctor + opening and nearby returns exact coordinates', async () => {
    // create via dev route
    const createRes = await request(app)
      .post('/api/dev/create-doctor')
      .send({ id: 'dev-doc-integration', clinicName: 'Geo Clinic', address: '1 Geo St', doctorName: 'Geo Doc', location: { coordinates: [-122.419415, 37.7749295] } })
    expect(createRes.statusCode).toBe(200)

    // get dev seed token (has doctor role) for authenticated calls
    const seed = await request(app).get('/api/dev/seed-token')
    expect(seed.statusCode).toBe(200)
    const token = seed.body && seed.body.token
    expect(token).toBeDefined()

    // create opening using dev token
    const openRes = await request(app)
      .post('/api/appointments/doctor/dev-doc-integration/openings')
      .set('Authorization', `Bearer ${token}`)
      .send({ start: new Date(Date.now() + 24*60*60*1000).toISOString(), location: { coordinates: [-122.419415, 37.7749295] } })
    expect(openRes.statusCode).toBe(200)

    // run nearby search (authenticated)
    const nearRes = await request(app)
      .get('/api/appointments/nearby')
      .set('Authorization', `Bearer ${token}`)
      .query({ lat: 37.7749295, lng: -122.419415, radius: 500 })
    expect(nearRes.statusCode).toBe(200)
    const body = nearRes.body
    expect(Array.isArray(body)).toBe(true)
    const found = body.find(d => d.id === 'dev-doc-integration')
    expect(found).toBeDefined()
    const opening = (found.openings || []).find(o => o.location && o.location.coordinates)
    expect(opening).toBeDefined()
    const coords = opening.location.coordinates
    expect(coords[0]).toBeCloseTo(-122.419415, 7)
    expect(coords[1]).toBeCloseTo(37.7749295, 7)
  }, 20000)
})
