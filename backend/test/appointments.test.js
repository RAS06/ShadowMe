// Appointments API Tests
const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDB } = require('../index');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

describe('Appointments API Tests', () => {
  let studentToken, doctorToken, adminToken;
  let studentUser, doctorUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Create test users
    const hashedPassword = await bcrypt.hash('TestPass123!!', 10);

    studentUser = await User.create({
      id: crypto.randomUUID(),
      email: `student-appt-test-${Date.now()}@example.com`,
      fullName: 'Student Appt Test',
      passwordHash: hashedPassword,
      role: 'student',
      emailVerified: true
    });

    doctorUser = await User.create({
      id: crypto.randomUUID(),
      email: `doctor-appt-test-${Date.now()}@example.com`,
      fullName: 'Doctor Appt Test',
      passwordHash: hashedPassword,
      role: 'doctor',
      emailVerified: true
    });

    // Login to get tokens
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentUser.email, password: 'TestPass123!!' });
    studentToken = studentLogin.body.token;

    const doctorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: doctorUser.email, password: 'TestPass123!!' });
    doctorToken = doctorLogin.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /appt-test/ });
    await mongoose.disconnect();
  });

  describe('POST /api/appointments - Doctor posts opportunity', () => {
    it('should allow doctor to post shadowing opportunity', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          specialty: 'Cardiology',
          description: 'Learn about cardiovascular procedures and patient care',
          date: '2025-12-25',
          availableSlots: 3,
          location: 'City Hospital',
          requirements: 'Professional attire required'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Shadowing opportunity posted successfully');
      expect(res.body.opportunity).toBeDefined();
      expect(res.body.opportunity.specialty).toBe('Cardiology');
    });

    it('should reject student posting opportunity', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          specialty: 'Neurology',
          description: 'Test',
          date: '2025-12-25',
          availableSlots: 2
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Doctor access required');
    });

    it('should reject opportunity without authentication', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({
          specialty: 'Neurology',
          description: 'Test',
          date: '2025-12-25',
          availableSlots: 2
        });

      expect(res.statusCode).toBe(401);
    });

    it('should reject opportunity with missing required fields', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          specialty: 'Cardiology'
          // Missing description, date, availableSlots
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Missing required fields');
    });

    it('should reject opportunity with past date', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          specialty: 'Cardiology',
          description: 'Test opportunity with past date',
          date: '2020-01-01',
          availableSlots: 2
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Opportunity date cannot be in the past');
    });

    it('should reject opportunity with invalid slots', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          specialty: 'Cardiology',
          description: 'Test opportunity',
          date: '2025-12-25',
          availableSlots: -1  // Negative slots
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Available slots must be at least 1');
    });
  });

  describe('GET /api/appointments/my-opportunities', () => {
    it('should allow doctor to fetch their opportunities', async () => {
      const res = await request(app)
        .get('/api/appointments/my-opportunities')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.opportunities).toBeDefined();
      expect(Array.isArray(res.body.opportunities)).toBe(true);
      expect(res.body.count).toBeDefined();
    });

    it('should reject student from fetching opportunities', async () => {
      const res = await request(app)
        .get('/api/appointments/my-opportunities')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Doctor access required');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .get('/api/appointments/my-opportunities');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/appointments/:id - Update opportunity', () => {
    it('should allow doctor to update opportunity', async () => {
      const res = await request(app)
        .put('/api/appointments/12345')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          specialty: 'Cardiology - Advanced',
          description: 'Updated description for cardiology opportunity',
          date: '2025-12-30',
          availableSlots: 5,
          location: 'Updated Hospital',
          requirements: 'Updated requirements'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Opportunity updated successfully');
      expect(res.body.opportunity.specialty).toBe('Cardiology - Advanced');
    });

    it('should reject student from updating', async () => {
      const res = await request(app)
        .put('/api/appointments/12345')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          specialty: 'Test',
          description: 'Test description',
          date: '2025-12-30',
          availableSlots: 2
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    it('should allow doctor to delete opportunity', async () => {
      const res = await request(app)
        .delete('/api/appointments/12345')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Opportunity deleted successfully');
      expect(res.body.deletedId).toBe('12345');
    });

    it('should reject student from deleting', async () => {
      const res = await request(app)
        .delete('/api/appointments/12345')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    it('should allow doctor to close opportunity', async () => {
      const res = await request(app)
        .patch('/api/appointments/12345/status')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'closed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Opportunity closed successfully');
      expect(res.body.newStatus).toBe('closed');
    });

    it('should allow doctor to reopen opportunity', async () => {
      const res = await request(app)
        .patch('/api/appointments/12345/status')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'available' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Opportunity reopened successfully');
      expect(res.body.newStatus).toBe('available');
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch('/api/appointments/12345/status')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'invalid_status' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid status');
    });

    it('should reject student from changing status', async () => {
      const res = await request(app)
        .patch('/api/appointments/12345/status')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'closed' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/appointments/book - Student requests shadowing', () => {
    it('should allow student to request shadowing', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentName: 'Test Student',
          studentEmail: 'student@example.com',
          school: 'Medical University',
          yearOfStudy: 'Third Year',
          preferredDate: '2025-12-20',
          duration: '1 day',
          specialty: 'Cardiology',
          reasonForShadowing: 'I am interested in cardiology and want to learn more about cardiovascular procedures and patient care.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Shadowing request submitted successfully');
      expect(res.body.request).toBeDefined();
    });

    it('should reject request with missing fields', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentName: 'Test Student'
          // Missing other required fields
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Missing required fields');
    });

    it('should reject request with short reason', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentName: 'Test Student',
          studentEmail: 'student@example.com',
          school: 'Medical University',
          yearOfStudy: 'Third Year',
          preferredDate: '2025-12-20',
          duration: '1 day',
          specialty: 'Cardiology',
          reasonForShadowing: 'Short' // Too short
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('at least 20 characters');
    });
  });
});
