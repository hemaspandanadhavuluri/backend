// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // <--- Imported
const path = require('path');
const multer = require('multer');
const leadRoutes = require('./routes/leadRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const offerRoutes = require('./routes/offerRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

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
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/candidates', candidateRoutes);

// Basic health check route
app.get('/', (req, res) => {
    res.send('Lead Management API is running...');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
