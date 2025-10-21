const mongoose = require('mongoose')

const refreshTokenSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true }, // UUID
  userId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  isRevoked: { type: Boolean, default: false }
}, { collection: 'refresh_tokens' })

refreshTokenSchema.index({ userId: 1 })
refreshTokenSchema.index({ expiresAt: 1 })
refreshTokenSchema.index({ tokenHash: 1 }, { unique: true })

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)
