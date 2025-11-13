const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

// Employee routes
router.post('/request', leaveController.submitLeaveRequest);
router.get('/employee/:employeeId', leaveController.getEmployeeLeaveRequests);

// HR routes
router.get('/all', leaveController.getAllLeaveRequests);
router.put('/:id/status', leaveController.handleLeaveRequest);

module.exports = router;
