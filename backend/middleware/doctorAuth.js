// Middleware to verify user is a doctor
// Must be used AFTER the auth middleware since it requires req.user

const User = require('../models/User')

async function doctorAuth(req, res, next) {
  try {
    // req.user should be set by the auth middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      })
    }

    // Fetch the full user from database to check role
    const user = await User.findOne({ id: req.user.id }).lean()
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Your user account could not be found'
      })
    }

    // Check if user is a doctor
    if (user.role !== 'doctor') {
      return res.status(403).json({ 
        error: 'Doctor access required',
        message: 'Only verified doctors can post shadowing opportunities',
        currentRole: user.role
      })
    }

    // User is a doctor, attach full user info to request
    req.doctor = user
    next()

  } catch (error) {
    console.error('Error in doctorAuth middleware:', error)
    return res.status(500).json({ error: 'Failed to verify doctor status' })
  }
}

module.exports = doctorAuth
