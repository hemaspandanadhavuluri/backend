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

// Birthday wishes route
router.post('/send-birthday-wishes', userController.sendBirthdayWishes);

// Employee management routes
router.get('/active', userController.getActiveEmployees);
router.get('/inactive', userController.getInactiveEmployees);
// Update employee salary
router.put('/:id/salary', userController.updateSalary);
router.put('/:id/salary/approve', userController.approvePendingSalary);
router.put('/:id/salary/decline', userController.declinePendingSalary);
router.put('/:id/status', userController.updateEmployeeStatus);

// Onboarding and Training routes
router.get('/onboarding', userController.getOnboardingCandidates);
router.put('/:id/assign-trainer', userController.assignTrainer);
router.put('/:id/update-progress', userController.updateProgress);

// Employee panel routes
router.post('/employee-login', userController.employeeLogin);
router.post('/create-employee-credentials', userController.createEmployeeCredentials);
router.post('/profile-edit-request', userController.submitProfileEditRequest);
router.get('/profile-edit-requests', userController.getProfileEditRequests);
router.put('/profile-edit-request/:id', userController.handleProfileEditRequest);
router.get('/profile-edit-requests/:employeeId', userController.getProfileEditRequestsForEmployee);
router.put('/profile-edit-requests/:employeeId/approve', userController.approveAllProfileEditRequests);
router.put('/profile-edit-requests/:employeeId/reject', userController.rejectAllProfileEditRequests);

// Resignation request routes
router.post('/resignation-request', userController.uploadResignationLetter, userController.submitResignationRequest);
router.get('/resignation-requests', userController.getResignationRequests);
router.get('/resignation-request/:employeeId', userController.getResignationRequestForEmployee);
router.put('/resignation-request/:id', userController.handleResignationRequest);

module.exports = router;
