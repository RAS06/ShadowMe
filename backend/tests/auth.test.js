const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../index'); // Make sure index.js exports the app
const prisma = new PrismaClient();

describe('Authentication Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  let authToken;

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/signup', () => {
    it('should create a new user and return JWT token', async () => {
      const res = await request(app)
        .post('/api/signup')
        .send(testUser)
        .expect(201);

      // Check response
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      });
      expect(user).toBeTruthy();
      expect(user.email).toBe(testUser.email);

      // Verify password was hashed
      const validPassword = await bcrypt.compare(testUser.password, user.password);
      expect(validPassword).toBe(true);
    });

    it('should return 400 if user already exists', async () => {
      // Create user first
      await request(app)
        .post('/api/signup')
        .send(testUser);

      // Try to create same user again
      const res = await request(app)
        .post('/api/signup')
        .send(testUser)
        .expect(400);

      expect(res.body).toHaveProperty('message', 'User already exists');
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/signup')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors[0]).toHaveProperty('path', 'email');
    });

    it('should validate password length', async () => {
      const res = await request(app)
        .post('/api/signup')
        .send({
          email: 'test@example.com',
          password: '12345' // too short
        })
        .expect(400);

      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors[0]).toHaveProperty('path', 'password');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/signup')
        .send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send(testUser)
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');

      // Verify JWT token
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('userId');

      // Save token for logout test
      authToken = res.body.token;
    });

    it('should return 400 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(400);

      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 with non-existent user', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('POST /api/logout', () => {
    beforeEach(async () => {
      // Create and login a test user before each logout test
      await request(app)
        .post('/api/signup')
        .send(testUser);
      
      const loginRes = await request(app)
        .post('/api/login')
        .send(testUser);
      
      authToken = loginRes.body.token;
    });

    it('should successfully logout with valid token', async () => {
      const res = await request(app)
        .post('/api/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .post('/api/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Token is not valid');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/logout')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'No token, authorization denied');
    });
  });

  describe('GET /api/me', () => {
    let userId;

    beforeEach(async () => {
      // Create and login a test user
      const signupRes = await request(app)
        .post('/api/signup')
        .send(testUser);
      
      authToken = signupRes.body.token;
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      userId = decoded.userId;
    });

    it('should return user data with valid token', async () => {
      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Token is not valid');
    });
  });
});