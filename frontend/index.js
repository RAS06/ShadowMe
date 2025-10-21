// Simple Express server to serve static frontend and keep the container running
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;



// Fallback route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log('ShadowMe Frontend Application');
  console.log(`Application starting on port ${port}...`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});
