const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'

module.exports = function (req, res, next) {
  const auth = req.headers.authorization
  // debug log
  // console.log('auth header:', auth && auth.slice(0,30))
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing auth token' })
  const token = auth.slice(7)
  try {
  const payload = jwt.verify(token, JWT_SECRET)
  // Attach user id, email and optional role/profileId from token to avoid extra DB lookups
  req.user = { id: payload.sub, email: payload.email }
  if (payload.role) req.user.role = payload.role
  if (payload.profileId) req.user.profileId = payload.profileId
    next()
  } catch (err) {
    console.error('auth verify error', err && err.message)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
