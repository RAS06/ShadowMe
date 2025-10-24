require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
// Allow credentials so httpOnly cookies can be sent from the client
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const startServer = async () => {
  // If Mongo is required, ensure connection before starting
  if (process.env.MONGODB_URI) {
    const { connect } = require('./utils/mongo');
    try {
      await connect(process.env.MONGODB_URI, process.env.MONGODB_DB || 'shadowme');
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log('ShadowMe Backend Server');
      console.log(`Server is running on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      server.close(() => process.exit(0));
    });
  }
};

startServer();

module.exports = app;
