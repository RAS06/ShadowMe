const User = require('../models/User')

module.exports = function requireRole(...allowed) {
  return async function (req, res, next) {
    try {
      if (!req.user || !req.user.id) return res.status(401).json({ error: 'Missing auth' })
      const user = await User.findOne({ id: req.user.id }).lean().exec()
  console.log('requireRole: checking user', req.user.id, 'dbRecord=', user)
      if (!user) return res.status(401).json({ error: 'User not found' })
      // If role is missing in DB, try to use role from JWT (req.user.role) if present and allowed.
      if (!user.role) {
        if (req.user && req.user.role && allowed.includes(req.user.role)) {
          // persist the role from token into DB for future checks
          try {
            await User.updateOne({ id: user.id }, { $set: { role: req.user.role } }).exec()
            user.role = req.user.role
            console.log('requireRole: persisted role from token', user.id, user.role)
          } catch (e) {
            console.warn('requireRole: failed to persist token role for', user.id, e.message || e)
            // fall through to assign default below if persistence fails
          }
        } else {
          // If token did not provide a usable role, assume 'student' by default and persist it so future checks succeed
          try {
            await User.updateOne({ id: user.id }, { $set: { role: 'student' } }).exec()
            user.role = 'student'
            console.log('requireRole: assigned default role=student to user', user.id)
          } catch (e) {
            console.warn('requireRole: failed to persist default role for', user.id, e.message || e)
          }
        }
      }
      if (!allowed.includes(user.role)) return res.status(403).json({ error: 'Forbidden: insufficient role' })
      req.user.role = user.role
      req.user.profileId = user.profileId
      next()
    } catch (err) {
      console.error('requireRole error', err)
      res.status(500).json({ error: 'Role check failed' })
    }
  }
}
