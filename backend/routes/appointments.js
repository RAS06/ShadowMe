const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const doctorAuth = require('../middleware/doctorAuth')

// Student requests shadowing opportunity
// Protected - requires authentication
router.post('/book', authMiddleware, async (req, res) => {
  try {
    const { studentName, studentEmail, school, yearOfStudy, preferredDate, duration, specialty, reasonForShadowing, preferredDoctor } = req.body

    // Basic validation
    if (!studentName || !studentEmail || !school || !yearOfStudy || !preferredDate || !duration || !specialty || !reasonForShadowing) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['studentName', 'studentEmail', 'school', 'yearOfStudy', 'preferredDate', 'duration', 'specialty', 'reasonForShadowing']
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(studentEmail)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    // Date validation - must be today or future
    const shadowDate = new Date(preferredDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (shadowDate < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' })
    }

    // Reason validation
    if (reasonForShadowing.length < 20) {
      return res.status(400).json({ error: 'Please provide a more detailed explanation (at least 20 characters)' })
    }

    // TODO: Create ShadowingRequest model and save to database
    // For now, just return success with mock data
    const mockRequest = {
      id: Date.now().toString(),
      requestId: `SR-${Date.now()}`,
      studentName,
      studentEmail,
      school,
      yearOfStudy,
      preferredDate,
      duration,
      specialty,
      reasonForShadowing,
      preferredDoctor: preferredDoctor || 'Any Available',
      studentId: req.user.id, // from auth middleware
      status: 'pending', // pending, approved, rejected
      submittedAt: new Date().toISOString()
    }

    console.log('Shadowing request submitted (mock):', mockRequest)

    res.status(201).json({
      message: 'Shadowing request submitted successfully',
      requestId: mockRequest.requestId,
      request: mockRequest
    })

  } catch (error) {
    console.error('Error submitting shadowing request:', error)
    res.status(500).json({ error: 'Failed to submit shadowing request' })
  }
})

// Doctor posts a shadowing opportunity
// Protected - requires authentication AND doctor role
router.post('/', authMiddleware, doctorAuth, async (req, res) => {
  try {
    const { specialty, description, date, availableSlots, location, requirements } = req.body

    // Basic validation
    if (!specialty || !description || !date || !availableSlots) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['specialty', 'description', 'date', 'availableSlots']
      })
    }

    // Date validation - must be today or future
    const opportunityDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (opportunityDate < today) {
      return res.status(400).json({ error: 'Opportunity date cannot be in the past' })
    }

    // Validate availableSlots is a positive number
    if (isNaN(availableSlots) || availableSlots < 1) {
      return res.status(400).json({ error: 'Available slots must be at least 1' })
    }

    // TODO: Create ShadowingOpportunity model and save to database
    // For now, just return success with mock data
    const mockOpportunity = {
      id: Date.now().toString(),
      opportunityId: `OP-${Date.now()}`,
      specialty,
      description,
      date,
      availableSlots,
      location: location || 'TBD',
      requirements: requirements || 'None',
      doctorId: req.user.id, // from auth middleware
      doctorName: req.doctor.fullName, // from doctorAuth middleware
      doctorEmail: req.doctor.email,
      status: 'available', // available, fully-booked, cancelled
      createdAt: new Date().toISOString()
    }

    console.log('Shadowing opportunity posted by doctor:', req.doctor.fullName, mockOpportunity)

    res.status(201).json({
      message: 'Shadowing opportunity posted successfully',
      opportunityId: mockOpportunity.id,
      opportunity: mockOpportunity
    })

  } catch (error) {
    console.error('Error posting shadowing opportunity:', error)
    res.status(500).json({ error: 'Failed to post shadowing opportunity' })
  }
})

// Get doctor's own opportunities
// Protected - requires authentication AND doctor role
router.get('/my-opportunities', authMiddleware, doctorAuth, async (req, res) => {
  try {
    // TODO: Query database for opportunities where doctorId matches req.user.id
    // For now, return mock data
    const mockOpportunities = [
      {
        id: '1762491341284',
        opportunityId: 'OP-1762491341284',
        specialty: 'Cardiology',
        description: 'Shadow a cardiologist in a busy hospital setting. Great learning experience.',
        date: '2025-12-15',
        availableSlots: 3,
        location: 'City Hospital',
        requirements: 'Professional attire required',
        doctorId: req.user.id,
        doctorName: req.doctor.fullName,
        doctorEmail: req.doctor.email,
        status: 'available',
        createdAt: '2025-11-07T04:55:41.284Z'
      }
    ]

    console.log(`Doctor ${req.doctor.fullName} fetched ${mockOpportunities.length} opportunities`)

    res.status(200).json({
      opportunities: mockOpportunities,
      count: mockOpportunities.length
    })

  } catch (error) {
    console.error('Error fetching opportunities:', error)
    res.status(500).json({ error: 'Failed to fetch opportunities' })
  }
})

// Update opportunity
// Protected - requires authentication AND doctor role
router.put('/:id', authMiddleware, doctorAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { specialty, description, date, availableSlots, location, requirements } = req.body

    // Basic validation
    if (!specialty || !description || !date || !availableSlots) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['specialty', 'description', 'date', 'availableSlots']
      })
    }

    // Date validation
    const opportunityDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (opportunityDate < today) {
      return res.status(400).json({ error: 'Opportunity date cannot be in the past' })
    }

    // Validate availableSlots
    if (isNaN(availableSlots) || availableSlots < 1) {
      return res.status(400).json({ error: 'Available slots must be at least 1' })
    }

    // TODO: Update in database, verify doctorId matches req.user.id
    const updatedOpportunity = {
      id,
      specialty,
      description,
      date,
      availableSlots,
      location: location || 'TBD',
      requirements: requirements || 'None',
      doctorId: req.user.id,
      doctorName: req.doctor.fullName,
      doctorEmail: req.doctor.email,
      updatedAt: new Date().toISOString()
    }

    console.log(`Doctor ${req.doctor.fullName} updated opportunity ${id}`)

    res.status(200).json({
      message: 'Opportunity updated successfully',
      opportunity: updatedOpportunity
    })

  } catch (error) {
    console.error('Error updating opportunity:', error)
    res.status(500).json({ error: 'Failed to update opportunity' })
  }
})

// Delete opportunity
// Protected - requires authentication AND doctor role
router.delete('/:id', authMiddleware, doctorAuth, async (req, res) => {
  try {
    const { id } = req.params

    // TODO: Delete from database, verify doctorId matches req.user.id
    console.log(`Doctor ${req.doctor.fullName} deleted opportunity ${id}`)

    res.status(200).json({
      message: 'Opportunity deleted successfully',
      deletedId: id
    })

  } catch (error) {
    console.error('Error deleting opportunity:', error)
    res.status(500).json({ error: 'Failed to delete opportunity' })
  }
})

// Toggle opportunity status (open/closed)
// Protected - requires authentication AND doctor role
router.patch('/:id/status', authMiddleware, doctorAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['available', 'closed'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        allowedValues: ['available', 'closed']
      })
    }

    // TODO: Update status in database, verify doctorId matches req.user.id
    console.log(`Doctor ${req.doctor.fullName} changed opportunity ${id} status to ${status}`)

    res.status(200).json({
      message: `Opportunity ${status === 'available' ? 'reopened' : 'closed'} successfully`,
      opportunityId: id,
      newStatus: status
    })

  } catch (error) {
    console.error('Error updating status:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

module.exports = router
