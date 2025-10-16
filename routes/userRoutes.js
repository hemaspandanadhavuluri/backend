// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// const { protect, checkRole } = require('../middleware/authMiddleware');
// In a real app, you would require authorization to run this:
// router.post('/register', protect, checkRole(['CEO', 'HR']), userController.registerUser);

// User Registration/Creation Route with file upload
router.post('/register', userController.uploadFiles, userController.registerUser);

// Route to get managers for dropdowns
router.get('/managers', userController.getManagers);

// New routes for employee login
router.post('/send-otp', userController.sendOTP);
router.post('/verify-otp', userController.verifyOTP);

module.exports = router;
