const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// Payroll management routes
router.post('/generate', payrollController.generatePayroll);
router.get('/employee/:employeeId', payrollController.getEmployeePayroll);
router.get('/all', payrollController.getAllPayroll);
router.put('/:id/status', payrollController.updatePayrollStatus);

// Benefit request routes
router.post('/benefit-request', payrollController.submitBenefitRequest);
router.get('/benefit-requests/employee/:employeeId', payrollController.getEmployeeBenefitRequests);
router.get('/benefit-requests/all', payrollController.getAllBenefitRequests);
router.put('/benefit-request/:id/status', payrollController.handleBenefitRequest);

module.exports = router;
