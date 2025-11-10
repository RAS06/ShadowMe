const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const User = require('../models/User')

// Promote user to doctor role
// Protected - requires admin API key
router.post('/users/:userId/promote-to-doctor', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params

    // Find user by id
    const user = await User.findOne({ id: userId })
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: `No user found with ID: ${userId}`
      })
    }

    // Check if already a doctor
    if (user.role === 'doctor') {
      return res.status(400).json({ 
        error: 'User is already a doctor',
        message: `User ${user.fullName} (${user.email}) is already marked as a doctor`
      })
    }

    // Update role to doctor
    user.role = 'doctor'
    await user.save()

    console.log(`[ADMIN] User promoted to doctor: ${user.email} (${user.id})`)

    res.status(200).json({
      message: 'User successfully promoted to doctor',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        updatedAt: user.updated_at
      }
    })

  } catch (error) {
    console.error('Error promoting user to doctor:', error)
    res.status(500).json({ error: 'Failed to promote user to doctor' })
  }
})

// Demote doctor back to student role
// Protected - requires admin API key
router.post('/users/:userId/demote-to-student', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params

    // Find user by id
    const user = await User.findOne({ id: userId })
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: `No user found with ID: ${userId}`
      })
    }

    // Check if already a student
    if (user.role === 'student') {
      return res.status(400).json({ 
        error: 'User is already a student',
        message: `User ${user.fullName} (${user.email}) is already marked as a student`
      })
    }

    // Prevent demoting admins
    if (user.role === 'admin') {
      return res.status(403).json({ 
        error: 'Cannot demote admin users',
        message: 'Admin users cannot be demoted through this endpoint'
      })
    }

    // Update role to student
    user.role = 'student'
    await user.save()

    console.log(`[ADMIN] User demoted to student: ${user.email} (${user.id})`)

    res.status(200).json({
      message: 'User successfully demoted to student',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        updatedAt: user.updated_at
      }
    })

  } catch (error) {
    console.error('Error demoting user to student:', error)
    res.status(500).json({ error: 'Failed to demote user to student' })
  }
})

// Get user by email (for finding userId)
// Protected - requires admin API key
router.get('/users/by-email/:email', adminAuth, async (req, res) => {
  try {
    const { email } = req.params

    const user = await User.findOne({ email: email.toLowerCase() }).lean()
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: `No user found with email: ${email}`
      })
    }

    // Return safe user data (no password hash)
    const { passwordHash, _id, __v, ...safeUser } = user

    res.status(200).json({
      user: safeUser
    })

  } catch (error) {
    console.error('Error fetching user by email:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// List all users with their roles
// Protected - requires admin API key
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, limit = 50, skip = 0 } = req.query

    // Build query
    const query = {}
    if (role) {
      if (!['student', 'doctor', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be: student, doctor, or admin' })
      }
      query.role = role
    }

    // Fetch users
    const users = await User.find(query)
      .select('-passwordHash -_id -__v') // Exclude sensitive fields
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ created_at: -1 })
      .lean()

    const totalCount = await User.countDocuments(query)

    res.status(200).json({
      users,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        returned: users.length
      }
    })

  } catch (error) {
    console.error('Error listing users:', error)
    res.status(500).json({ error: 'Failed to list users' })
  }
})

module.exports = router
