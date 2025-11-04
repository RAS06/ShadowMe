// Separate server startup for production/dev
const { app, connectDB } = require('./index');
const mongoose = require('mongoose');
const port = parseInt(process.env.PORT, 10) || 3000;

// Start server and attach error handler for common listen errors
const server = app.listen(port, async () => {
  console.log(`Backend server listening on port ${port}`);
  await connectDB();
  // Development helper: regenerate frontend seed token so dev UI always gets a valid JWT
  try {
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      const fs = require('fs')
      const path = require('path')
      const jwt = require('jsonwebtoken')
      const payload = {
        sub: process.env.DEV_SEED_SUB || 'e3805ad0-11d3-4af8-be26-834eae3aed98',
        email: process.env.DEV_SEED_EMAIL || 'doctor@email.com',
        role: process.env.DEV_SEED_ROLE || 'doctor',
        profileId: process.env.DEV_SEED_PROFILEID || 'fe3b7be3-c4f5-482b-b647-3a400b3c3259'
      }
      const secret = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string'
      const token = jwt.sign(payload, secret, { expiresIn: process.env.DEV_SEED_EXPIRES || '30d' })
      const out = { token, user: { id: payload.sub, email: payload.email, role: payload.role, profileId: payload.profileId } }
      const target = path.join(__dirname, '..', 'frontend', 'public', 'seed-token.json')
      try { fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf8'); console.log('Wrote dev seed token to', target) } catch (err) { console.warn('Failed to write seed-token.json', err && err.message) }
    }
  } catch (e) {
    console.warn('Dev seed token generation failed', e && e.message)
  }
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. \n` +
      `If you intended to run the server on a different port, set the PORT env var.\n` +
      `Example: PORT=3001 npm start`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  try {
    if (mongoose && mongoose.disconnect) await mongoose.disconnect();
  } catch (e) {
    console.warn('Error closing DB client', e.message || e);
  }
  server.close(() => process.exit(0));
});