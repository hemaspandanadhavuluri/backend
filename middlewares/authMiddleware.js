// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Required to confirm user exists

// Mock JWT Secret for demonstration
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

exports.protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // 3. Attach user data to request (including role/hierarchy for filtering)
            // In a real app, you'd fetch the user from DB to ensure they are active
            req.user = {
                id: decoded.id,
                role: decoded.role,
                zone: decoded.zone,
                region: decoded.region,
                fullName: decoded.fullName
            };
            
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};