// Integration tests for account creation, sign in, and logout
// Run with: npm test (from backend directory)

const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDB } = require('../index'); // Express app and DB connect

// Helper: generate a unique email for each test run
function uniqueEmail() {
  return `testuser_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
}

describe('Auth API', () => {
  let testEmail, testPassword, testFullName;
  beforeAll(async () => {
    // Wait for DB connection if needed
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  });

  afterAll(async () => {
    // Clean up test user from DB
    const User = mongoose.model('User');
    await User.deleteMany({ email: /testuser_/ });
    await mongoose.disconnect();
  });

  it('should create a new user (register)', async () => {
    testEmail = uniqueEmail();
  testPassword = 'Testpass!@12';
    testFullName = 'Test User';
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, fullName: testFullName });
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should not allow duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, fullName: testFullName });
    expect(res.statusCode).toBe(409);
  });

  it('should sign in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should reject sign in with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPass!12' });
    expect(res.statusCode).toBe(401);
  });

  it('should log out (revoke refresh token)', async () => {
    // First, login to get a refresh token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    // Now, revoke
    const res = await request(app)
      .post('/api/auth/revoke')
      .set('Cookie', cookies)
      .send({ refreshToken: cookies[0]?.split('=')[1]?.split(';')[0] });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
