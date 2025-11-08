(async () => {
  try {
    const path = require('path')
    require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') })
    const mongoose = require('mongoose')
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'shadowme' })

    const User = require('../backend/models/User')
    const Student = require('../backend/models/Student')
    const Doctor = require('../backend/models/Doctor')
    const bcrypt = require('bcryptjs')
    const jwt = require('jsonwebtoken')

    const fullName = 'Doctor Doctor'
    let user = await User.findOne({ fullName }).exec()
    if (!user) {
      console.log('User not found; creating new Student user')
      const email = `doctor.doctor+${Date.now()}@example.com`
      const password = 'Testpass!@12'
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)
      const student = new Student({ address: 'Clinic address', location: { type: 'Point', coordinates: [0, 0] } })
      await student.save()
      user = new User({ fullName, email, passwordHash, role: 'student', profileId: student.id })
      await user.save()
      console.log('Created user', user.id, user.email)
    } else {
      console.log('Found user', user.id, user.email)
    }

    // create doctor profile
    const clinicName = `${fullName} Clinic`
    const address = '123 Promotion St'
    const doctor = new Doctor({ clinicName, address, location: { type: 'Point', coordinates: [0,0] }, doctorName: fullName })
    await doctor.save()

    user.role = 'doctor'
    user.profileId = doctor.id
    await user.save()

    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, profileId: user.profileId }, process.env.JWT_SECRET || 'test_secret_123', { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' })

    console.log('Promotion complete')
    console.log('doctorId:', doctor.id)
    console.log('token:', token)

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('Error', err)
    process.exit(1)
  }
})()
