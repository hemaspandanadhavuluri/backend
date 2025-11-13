const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Employee routes
router.post('/mark', attendanceController.markAttendance);
router.get('/employee/:employeeId', attendanceController.getEmployeeAttendance);

// HR routes
router.get('/stats', attendanceController.getAttendanceStats);
router.get('/all', attendanceController.getAllAttendance);

module.exports = router;
