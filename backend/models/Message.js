const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: false },
  senderName: { type: String, required: false },
  senderRole: { type: String, required: false },
  text: { type: String, required: true },
  ts: { type: Date, default: () => new Date(), index: true }
}, {
  collection: 'messages',
  timestamps: false
})

module.exports = mongoose.model('Message', messageSchema)
