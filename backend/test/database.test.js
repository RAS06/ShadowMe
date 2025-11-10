// Database and User Model Tests
const mongoose = require('mongoose');
const User = require('../models/User');
const { connectDB } = require('../index');

describe('Database and User Model Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  });

  afterAll(async () => {
    // Clean up test users
    await User.deleteMany({ email: /^db-test-/ });
    await mongoose.disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to MongoDB successfully', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    it('should have the correct database name', () => {
      expect(mongoose.connection.name).toBeDefined();
    });

    it('should be able to list collections', async () => {
      const collections = await mongoose.connection.db.listCollections().toArray();
      expect(Array.isArray(collections)).toBe(true);
    });
  });

  describe('User Model CRUD Operations', () => {
    let testUserId;
    const testEmail = `db-test-${Date.now()}@example.com`;

    it('should create a new user', async () => {
      const user = new User({
        id: require('crypto').randomUUID(),
        email: testEmail,
        fullName: 'Database Test User',
        passwordHash: 'hashed_password_here',
        emailVerified: false,
        role: 'student'
      });

      const savedUser = await user.save();
      testUserId = savedUser.id;

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(testEmail);
      expect(savedUser.role).toBe('student');
      expect(savedUser.created_at).toBeDefined();
    });

    it('should find user by email', async () => {
      const user = await User.findOne({ email: testEmail });
      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.fullName).toBe('Database Test User');
    });

    it('should find user by id', async () => {
      const user = await User.findOne({ id: testUserId });
      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
    });

    it('should update user role', async () => {
      const user = await User.findOne({ id: testUserId });
      user.role = 'doctor';
      await user.save();

      const updatedUser = await User.findOne({ id: testUserId });
      expect(updatedUser.role).toBe('doctor');
    });

    it('should update user emailVerified status', async () => {
      const result = await User.updateOne(
        { id: testUserId },
        { $set: { emailVerified: true } }
      );
      expect(result.modifiedCount).toBe(1);

      const user = await User.findOne({ id: testUserId });
      expect(user.emailVerified).toBe(true);
    });

    it('should delete user', async () => {
      const result = await User.deleteOne({ id: testUserId });
      expect(result.deletedCount).toBe(1);

      const deletedUser = await User.findOne({ id: testUserId });
      expect(deletedUser).toBeNull();
    });

    it('should enforce unique email constraint', async () => {
      const user1 = new User({
        id: require('crypto').randomUUID(),
        email: 'db-test-unique@example.com',
        fullName: 'User One',
        passwordHash: 'hash1',
        role: 'student'
      });
      await user1.save();

      const user2 = new User({
        id: require('crypto').randomUUID(),
        email: 'db-test-unique@example.com',
        fullName: 'User Two',
        passwordHash: 'hash2',
        role: 'student'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should default role to student', async () => {
      const user = new User({
        id: require('crypto').randomUUID(),
        email: `db-test-default-role-${Date.now()}@example.com`,
        fullName: 'Default Role User',
        passwordHash: 'hash'
      });
      const savedUser = await user.save();
      expect(savedUser.role).toBe('student');
    });

    it('should only allow valid roles', async () => {
      const user = new User({
        id: require('crypto').randomUUID(),
        email: `db-test-invalid-role-${Date.now()}@example.com`,
        fullName: 'Invalid Role User',
        passwordHash: 'hash',
        role: 'invalid_role'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Model Queries', () => {
    beforeAll(async () => {
      // Create multiple test users
      const users = [
        {
          id: require('crypto').randomUUID(),
          email: 'db-test-query-student1@example.com',
          fullName: 'Student One',
          passwordHash: 'hash',
          role: 'student'
        },
        {
          id: require('crypto').randomUUID(),
          email: 'db-test-query-student2@example.com',
          fullName: 'Student Two',
          passwordHash: 'hash',
          role: 'student'
        },
        {
          id: require('crypto').randomUUID(),
          email: 'db-test-query-doctor@example.com',
          fullName: 'Doctor One',
          passwordHash: 'hash',
          role: 'doctor'
        }
      ];

      await User.insertMany(users);
    });

    it('should find all users with student role', async () => {
      const students = await User.find({ role: 'student', email: /^db-test-query/ });
      expect(students.length).toBeGreaterThanOrEqual(2);
      students.forEach(student => {
        expect(student.role).toBe('student');
      });
    });

    it('should find all users with doctor role', async () => {
      const doctors = await User.find({ role: 'doctor', email: /^db-test-query/ });
      expect(doctors.length).toBeGreaterThanOrEqual(1);
      doctors.forEach(doctor => {
        expect(doctor.role).toBe('doctor');
      });
    });

    it('should count total test users', async () => {
      const count = await User.countDocuments({ email: /^db-test-query/ });
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });
});
