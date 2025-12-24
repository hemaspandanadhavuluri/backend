// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // <--- Imported
const path = require('path');
const leadRoutes = require('./routes/leadRoutes'); // Corrected path
const userRoutes = require('./routes/userRoutes');
const bankRoutes = require('./routes/bankRoutes');
const emailService = require('./services/emailService');
const taskRoutes = require('./routes/taskRoutes'); // Import task routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadmanagementdb';

// Database Connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected successfully!'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Initialize the email service after DB connection
mongoose.connection.once('open', () => {
    emailService.init().catch(err => {
        console.error('Failed to initialize email service:', err);
    });
});

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/tasks', taskRoutes); // Add task routes

// Basic health check route
app.get('/', (req, res) => {
    res.send('Lead Management API is running...');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
