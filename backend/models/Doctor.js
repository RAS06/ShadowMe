const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  // timestamp for the appointment opening
  appointmentId: { type: String, default: () => require('crypto').randomUUID(), index: true },
  start: { type: Date, required: true },
  end: { type: Date, required: false },
  // optional human-readable address for the appointment location (derived from doctor's input)
  address: { type: String, default: undefined },
  // appointment-specific location (GeoJSON Point) - doctor does not hold location globally
  location: {
    type: { type: String, enum: ['Point'], default: undefined },
    coordinates: { type: [Number], default: undefined } // [lng, lat]
  },
  // whether this slot is booked and by which student id
  isBooked: { type: Boolean, default: false },
  bookedByStudentId: { type: String, default: null },
  // whether the appointment has been completed
  isCompleted: { type: Boolean, default: false }
}, { _id: false })

const doctorSchema = new mongoose.Schema({
  // auto-generated uuid for API-level id
  id: { type: String, default: () => require('crypto').randomUUID(), unique: true, index: true },
  clinicName: { type: String, required: true },
  address: { type: String, required: true },
  // doctor-level fields (clinic info) - appointment locations are stored on appointment subdocuments
  doctorName: { type: String, required: true },
  // optional clinic-level location (GeoJSON Point) for display / default pickup coordinates
  location: {
    type: { type: String, enum: ['Point'], default: undefined },
    // avoid defaulting to an empty array (which can create invalid GeoJSON); only set when provided
    coordinates: { type: [Number], default: undefined }
  },
  appointments: { type: [appointmentSchema], default: [] }
}, {
  collection: 'doctors',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

// 2dsphere index on appointments.location for geospatial queries targeting appointment locations
doctorSchema.index({ 'appointments.location': '2dsphere' })

module.exports = mongoose.model('Doctor', doctorSchema)
