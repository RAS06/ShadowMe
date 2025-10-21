const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  // Use a UUID id to mirror the provided SQL schema (stored as string)
  id: { type: String, default: () => require('crypto').randomUUID(), unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  emailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date, default: null }
}, {
  collection: 'users',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// indexes: email unique and created_at index
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ created_at: 1 })

module.exports = mongoose.model('User', userSchema)
