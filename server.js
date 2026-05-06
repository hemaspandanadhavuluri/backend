// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // <--- Imported
const path = require('path');
const leadRoutes = require('./routes/leadRoutes'); // Corrected path
const userRoutes = require('./routes/userRoutes');
const bankRoutes = require('./routes/bankRoutes');
const bankComparisonRoutes = require('./routes/bankComparisonRoutes');
const emailService = require('./services/emailService');
const taskRoutes = require('./routes/taskRoutes'); // Import task routes
const emiRoutes = require('./routes/emiRoutes'); // Import EMI routes
const testimonialRoutes = require('./routes/testimonialRoutes'); // Import testimonials routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.warn('Warning: MONGODB_URI not found in .env. Using fallback connection string.');
}
const connectionString = MONGODB_URI || 'mongodb://13.48.131.69:27017/leadmanagementdb';

// Database Connection
mongoose.connect(connectionString)
    .then(() => {
        console.log('MongoDB Connected successfully!');
        // Initialize the email service after DB connection is established
        emailService.init().catch(err => {
            console.error('Email Service Initialization Failed:', err.message);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// CORS Configuration
const allowedOrigins = [
    'https://justtapcapital.com',
    'http://localhost:3000',
    'http://localhost:8080'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
    credentials: true
}));

app.use(express.json());

// Diagnostic middleware for OTP requests
app.use((req, res, next) => {
    if (req.path === '/api/users/send-otp' && req.method === 'POST') {
        console.log('[DEBUG] OTP Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/bank-comparisons', bankComparisonRoutes);
app.use('/api/tasks', taskRoutes); // Add task routes
app.use('/api/emi', emiRoutes); // Add EMI routes
app.use('/api/testimonials', testimonialRoutes); // Add testimonials routes

// Basic health check route
app.get('/', (req, res) => {
    res.send('Lead Management API is running...');
});

// Global Error Handler - catches any error thrown in routes
app.use((err, req, res, next) => {
    console.error('❌ Global Error Handler:', err);
    res.status(err.status || 500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
