// Admin middleware to verify admin API key
// Admins use a special API key instead of JWT for elevated operations

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-secret-key-change-in-production'

function adminAuth(req, res, next) {
  // Check for API key in headers
  const apiKey = req.headers['x-admin-api-key'] || req.headers['x-api-key']
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Admin API key required',
      message: 'Please provide X-Admin-API-Key header'
    })
  }

  if (apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({ 
      error: 'Invalid admin API key',
      message: 'The provided API key is not valid'
    })
  }

  // API key is valid, proceed
  next()
}

module.exports = adminAuth
