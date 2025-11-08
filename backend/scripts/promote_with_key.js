const path = require('path')
const fs = require('fs')
;(async () => {
  try {
    const envPath = path.resolve(__dirname, '../.env')
    const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
    const match = env.match(/ADMIN_API_KEY=(.*)/)
    const ADMIN_API_KEY = match ? match[1].trim() : process.env.ADMIN_API_KEY
    if (!ADMIN_API_KEY) throw new Error('ADMIN_API_KEY not found in backend/.env')

    // connect to DB using project's mongoose
    const mongoose = require('mongoose')
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'shadowme' })

    const User = require('../models/User')
    const Student = require('../models/Student')
    const bcrypt = require('bcryptjs')

    const fullName = 'Doctor Doctor'
    const password = 'doctorpass123!@'
    let user = await User.findOne({ fullName }).exec()
    if (!user) {
      console.log('User not found; creating new Student user')
      const email = `doctor.doctor+${Date.now()}@example.com`
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)
      const student = new (require('../models/Student'))({ address: 'Clinic address', location: { type: 'Point', coordinates: [0, 0] } })
      await student.save()
      user = new User({ fullName, email, passwordHash, role: 'student', profileId: student.id })
      await user.save()
      console.log('Created user', user.id, user.email)
    } else {
      console.log('Found user', user.id, user.email)
    }

    // call promote endpoint on running server
    const fetch = globalThis.fetch || (await import('node-fetch')).default
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
    const res = await fetch(`${serverUrl}/api/admin/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_API_KEY },
      body: JSON.stringify({ userId: user.id, clinicName: `${fullName} Clinic`, address: '123 Promotion St', location: { coordinates: [0, 0] } })
    })
    const j = await res.json().catch(() => null)
    console.log('HTTP', res.status)
    console.log(JSON.stringify(j, null, 2))

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('Error', err && err.message ? err.message : err)
    process.exit(1)
  }
})()
