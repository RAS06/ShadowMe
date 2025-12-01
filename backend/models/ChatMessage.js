const mongoose = require('mongoose')
const { encryptMessage, decryptMessage } = require('../utils/encryption')

const chatMessageSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['student', 'doctor'], required: true },
  senderName: { type: String, default: '' },
  message: { type: String, required: true }, // Stored encrypted
  timestamp: { type: Date, default: Date.now }
}, {
  collection: 'chat_messages',
  timestamps: false
})

// Index for efficient querying by appointment
chatMessageSchema.index({ appointmentId: 1, timestamp: 1 })

// Encrypt message before saving to database
chatMessageSchema.pre('save', async function(next) {
  if (this.isModified('message') && this.message) {
    try {
      // Store the original for potential validation, then encrypt
      const plaintext = this.message
      this.message = await encryptMessage(plaintext)
    } catch (err) {
      console.error('Failed to encrypt message:', err)
      return next(err)
    }
  }
  next()
})

// Decrypt message after loading from database
chatMessageSchema.post('find', async function(docs) {
  if (docs && docs.length > 0) {
    await Promise.all(docs.map(async (doc) => {
      if (doc.message) {
        try {
          doc.message = await decryptMessage(doc.message)
        } catch (err) {
          console.error('Failed to decrypt message:', err)
          doc.message = '[Encrypted]'
        }
      }
    }))
  }
})

chatMessageSchema.post('findOne', async function(doc) {
  if (doc && doc.message) {
    try {
      doc.message = await decryptMessage(doc.message)
    } catch (err) {
      console.error('Failed to decrypt message:', err)
      doc.message = '[Encrypted]'
    }
  }
})

module.exports = mongoose.model('ChatMessage', chatMessageSchema)
