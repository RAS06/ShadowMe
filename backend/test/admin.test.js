const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectDB } = require('../index');

function uniqueEmail() {
  return `admintest_${Date.now()}_${Math.floor(Math.random()*10000)}@example.com`;
}

describe('Admin API - promote', () => {
  let userAEmail, userBEmail, password;
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) await connectDB();
    password = 'Testpass!@12';
  });

  afterAll(async () => {
    const User = mongoose.model('User');
    await User.deleteMany({ email: /admintest_/ });
    await mongoose.disconnect();
  });

  it('should promote a user to doctor using ADMIN_API_KEY', async () => {
    userAEmail = uniqueEmail();
    userBEmail = uniqueEmail();

    // create two users
    const r1 = await request(app).post('/api/auth/register').send({ email: userAEmail, password, fullName: 'Admin Creator' });
    expect(r1.statusCode).toBe(200);
    const r2 = await request(app).post('/api/auth/register').send({ email: userBEmail, password, fullName: 'Doctor Target' });
    expect(r2.statusCode).toBe(200);

    // fetch userB id from DB
    const User = mongoose.model('User');
    const userB = await User.findOne({ email: userBEmail }).lean().exec();
    expect(userB).toBeDefined();

    // call promote endpoint using ADMIN_API_KEY
    process.env.ADMIN_API_KEY = 'test_admin_key_123'
    const promoteRes = await request(app)
      .post('/api/admin/promote')
      .set('x-admin-key', process.env.ADMIN_API_KEY)
      .send({ userId: userB.id, clinicName: 'Test Clinic', address: '123 Test St' });

    expect(promoteRes.statusCode).toBe(200);
    expect(promoteRes.body.ok).toBe(true);
    expect(promoteRes.body.doctorId).toBeDefined();
    expect(promoteRes.body.token).toBeDefined();

    // verify user role updated
    const updated = await User.findOne({ id: userB.id }).lean().exec();
    expect(updated.role).toBe('doctor');
    expect(updated.profileId).toBeDefined();
  });

  it('should reject promote when key missing/invalid', async () => {
    // create a fresh user
    const badEmail = uniqueEmail();
    const r = await request(app).post('/api/auth/register').send({ email: badEmail, password, fullName: 'Bad Target' });
    expect(r.statusCode).toBe(200);
    const User = mongoose.model('User');
    const badUser = await User.findOne({ email: badEmail }).lean().exec();

    // do not set header or send wrong key
    process.env.ADMIN_API_KEY = 'test_admin_key_123'
    const resNoKey = await request(app).post('/api/admin/promote').send({ userId: badUser.id });
    expect(resNoKey.statusCode).toBe(403);

    const resWrongKey = await request(app).post('/api/admin/promote').set('x-admin-key', 'wrong_key').send({ userId: badUser.id });
    expect(resWrongKey.statusCode).toBe(403);
  });
});
