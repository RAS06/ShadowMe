const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') })

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_123'

// Edit these values if you want a different seeded doctor
const payload = {
  sub: 'e3805ad0-11d3-4af8-be26-834eae3aed98',
  email: 'doctor@email.com',
  role: 'doctor',
  profileId: 'fe3b7be3-c4f5-482b-b647-3a400b3c3259'
}

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })

const out = {
  token,
  user: {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    profileId: payload.profileId
  }
}

const target = path.join(__dirname, '..', 'frontend', 'public', 'seed-token.json')
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf8')
console.log('Wrote seed token to', target)