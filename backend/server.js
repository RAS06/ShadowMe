// Separate server startup for production/dev
const { app, connectDB } = require('./index');
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;

const server = app.listen(port, async () => {
  console.log(`Backend server listening on port ${port}`);
  await connectDB();
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