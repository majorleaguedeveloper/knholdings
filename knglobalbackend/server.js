const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth'); 
const adminRoutes = require('./routes/admin');
const memberRoutes = require('./routes/member');
const sharesRoutes = require('./routes/shares');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express(); 

// Middleware
app.use(cors());
app.use(express.json());  
app.use(morgan('dev'));

// Connect to MongoDB
require('./config/db')();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/shares', sharesRoutes);

// Error handling middleware
app.use((err, req, res, next) => { 
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); 
});