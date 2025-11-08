const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
  id: { type: String, default: () => require('crypto').randomUUID(), unique: true, index: true },
  address: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: undefined },
    coordinates: { type: [Number], default: undefined } // [lng, lat]
  },
  // array of booked appointments (embedded minimal info)
  appointments: [{
    doctorId: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date },
    location: {
      type: { type: String, enum: ['Point'], default: undefined },
      coordinates: { type: [Number], default: undefined }
    }
  }],
  // optional link to a preferred doctor
  preferredDoctorId: { type: String, default: null }
}, {
  collection: 'students',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

studentSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('Student', studentSchema)
