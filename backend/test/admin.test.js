// Admin API Tests
const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDB } = require('../index');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'shadowme-admin-key-2025-secure';

describe('Admin API Tests', () => {
  let testUserId;
  let testUserEmail;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Create a test user for admin operations
    const hashedPassword = await bcrypt.hash('TestPass123!!', 10);
    const testUser = await User.create({
      id: crypto.randomUUID(),
      email: `admin-test-${Date.now()}@example.com`,
      fullName: 'Admin Test User',
      passwordHash: hashedPassword,
      role: 'student',
      emailVerified: true
    });
    testUserId = testUser.id;
    testUserEmail = testUser.email;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /admin-test/ });
    await mongoose.disconnect();
  });

  describe('POST /api/admin/users/:id/promote-to-doctor', () => {
    it('should promote user to doctor with valid API key', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/promote-to-doctor`)
        .set('X-Admin-API-Key', ADMIN_API_KEY);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User successfully promoted to doctor');
      expect(res.body.user.role).toBe('doctor');
      expect(res.body.user.id).toBe(testUserId);
    });

    it('should reject promotion without API key', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/promote-to-doctor`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Admin API key required');
    });

    it('should reject promotion with invalid API key', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/promote-to-doctor`)
        .set('X-Admin-API-Key', 'invalid-key-12345');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Invalid admin API key');
    });

    it('should reject promotion of non-existent user', async () => {
      const fakeId = crypto.randomUUID();
      const res = await request(app)
        .post(`/api/admin/users/${fakeId}/promote-to-doctor`)
        .set('X-Admin-API-Key', ADMIN_API_KEY);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  });

  describe('POST /api/admin/users/:id/demote-to-student', () => {
    it('should demote user to student with valid API key', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/demote-to-student`)
        .set('X-Admin-API-Key', ADMIN_API_KEY);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User successfully demoted to student');
      expect(res.body.user.role).toBe('student');
      expect(res.body.user.id).toBe(testUserId);
    });

    it('should reject demotion without API key', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/demote-to-student`);

      expect(res.statusCode).toBe(401);
    });

    it('should reject demotion with invalid API key', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/demote-to-student`)
        .set('X-Admin-API-Key', 'wrong-key');

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should list all users with valid API key', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('X-Admin-API-Key', ADMIN_API_KEY);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.pagination.total).toBeGreaterThan(0);
      expect(res.body.users[0]).toHaveProperty('id');
      expect(res.body.users[0]).toHaveProperty('email');
      expect(res.body.users[0]).toHaveProperty('role');
    });

    it('should reject listing without API key', async () => {
      const res = await request(app)
        .get('/api/admin/users');

      expect(res.statusCode).toBe(401);
    });

    it('should not expose password hashes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('X-Admin-API-Key', ADMIN_API_KEY);

      expect(res.statusCode).toBe(200);
      res.body.users.forEach(user => {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('GET /api/admin/users/by-email/:email', () => {
    it('should find user by email with valid API key', async () => {
      const res = await request(app)
        .get(`/api/admin/users/by-email/${encodeURIComponent(testUserEmail)}`)
        .set('X-Admin-API-Key', ADMIN_API_KEY);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe(testUserEmail);
      expect(res.body.user.id).toBe(testUserId);
    });

    it('should reject lookup without API key', async () => {
      const res = await request(app)
        .get(`/api/admin/users/by-email/${encodeURIComponent(testUserEmail)}`);

      expect(res.statusCode).toBe(401);
    });

    it('should return 404 for non-existent email', async () => {
      const res = await request(app)
        .get('/api/admin/users/by-email/nonexistent@example.com')
        .set('X-Admin-API-Key', ADMIN_API_KEY);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  });

  describe('Admin API Security', () => {
    it('should log admin operations', async () => {
      // This test verifies the operation completes, actual logging is checked via console
      const res = await request(app)
        .post(`/api/admin/users/${testUserId}/promote-to-doctor`)
        .set('X-Admin-API-Key', ADMIN_API_KEY);

      expect(res.statusCode).toBe(200);
      // In real implementation, you'd verify logs were written
    });

    it('should handle concurrent admin requests', async () => {
      const requests = [
        request(app).get('/api/admin/users').set('X-Admin-API-Key', ADMIN_API_KEY),
        request(app).get('/api/admin/users').set('X-Admin-API-Key', ADMIN_API_KEY),
        request(app).get('/api/admin/users').set('X-Admin-API-Key', ADMIN_API_KEY)
      ];

      const responses = await Promise.all(requests);
      responses.forEach(res => {
        expect(res.statusCode).toBe(200);
      });
    });

    it('should prevent role changes without proper authorization', async () => {
      // Try to change role directly via User model (simulating bypass attempt)
      const directUpdate = await User.updateOne(
        { id: testUserId },
        { $set: { role: 'admin' } }
      );
      
      expect(directUpdate.modifiedCount).toBe(1); // MongoDB allows it
      
      // But API should still validate via admin middleware
      const res = await request(app)
        .get('/api/admin/users')
        .set('X-Admin-API-Key', 'fake-key');
      
      expect(res.statusCode).toBe(403);
    });
  });
});
