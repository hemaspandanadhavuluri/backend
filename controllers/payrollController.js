const Payroll = require('../models/payrollModel');
const User = require('../models/userModel');
const Attendance = require('../models/attendanceModel');
const BenefitRequest = require('../models/benefitRequestModel');

/**
 * Generate payroll for an employee.
 * @route POST /api/payroll/generate
 */
exports.generatePayroll = async (req, res) => {
    const { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
        return res.status(400).json({ message: 'Employee ID, month, and year are required.' });
    }

    try {
        const user = await User.findById(employeeId);
        if (!user) {
            return res.status(404).json({ message: 'Employee not found.' });
        }

        // Check if payroll already exists for this month/year
        const existingPayroll = await Payroll.findOne({ employeeId, month, year });
        if (existingPayroll) {
            return res.status(409).json({ message: 'Payroll already exists for this month.' });
        }

        const annualPackage = user.salary;
        const monthlySalary = annualPackage / 12;

        // Calculate statutory deductions
        const pfDeduction = monthlySalary * 0.12;
        const gratuityDeduction = monthlySalary * 0.0481;

        // Calculate deductions from attendance
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);
        const attendances = await Attendance.find({
            employeeId,
            date: { $gte: startDate, $lt: endDate }
        });

        let lateDeduction = 0;
        let absentDeduction = 0;
        attendances.forEach(att => {
            if (att.status === 'absent') absentDeduction += 100;
            lateDeduction += (att.lateMinutes || 0) * 10;
        });
        const attendanceDeductions = lateDeduction + absentDeduction;

        // Calculate additions from approved benefit requests
        const benefitRequests = await BenefitRequest.find({
            employeeId,
            status: 'approved',
            approvedAt: { $gte: startDate, $lt: endDate }
        });
        const benefitsAddition = benefitRequests.reduce((sum, req) => sum + (req.amount || 0), 0);

        // For now, increments and incentives are 0, can be added later
        const increments = 0;
        const incentives = 0;

        const totalDeductions = pfDeduction + gratuityDeduction + attendanceDeductions;
        const totalAdditions = benefitsAddition + increments + incentives;
        const totalSalary = monthlySalary + totalAdditions - totalDeductions;

        const breakdown = {
            pf: pfDeduction,
            gratuity: gratuityDeduction,
            late: lateDeduction,
            absent: absentDeduction,
            benefits: benefitsAddition,
            increments,
            incentives,
            total: totalSalary
        };

        const payroll = await Payroll.create({
            employeeId,
            month,
            year,
            baseSalary: monthlySalary,
            deductions: totalDeductions,
            additions: totalAdditions,
            totalSalary,
            notes: JSON.stringify(breakdown)
        });

        res.status(201).json({
            message: 'Payroll generated successfully.',
            payroll
        });
    } catch (error) {
        console.error('Error generating payroll:', error);
        res.status(500).json({ message: 'Server error generating payroll.' });
    }
};

/**
 * Get payroll records for an employee.
 * @route GET /api/payroll/employee/:employeeId
 */
exports.getEmployeePayroll = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const payrollRecords = await Payroll.find({ employeeId }).sort({ year: -1, month: -1 });

        res.status(200).json(payrollRecords);
    } catch (error) {
        console.error('Error fetching payroll:', error);
        res.status(500).json({ message: 'Server error fetching payroll.' });
    }
};

/**
 * Get all payroll records for HR view.
 * @route GET /api/payroll/all
 */
exports.getAllPayroll = async (req, res) => {
    const { month, year, employeeId } = req.query;

    try {
        const query = {};

        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);
        if (employeeId) query.employeeId = employeeId;

        // Get payroll records
        const payrollRecords = await Payroll.find(query)
            .populate('employeeId', 'fullName employeeId department email')
            .sort({ year: -1, month: -1 });

        // If no specific employee and month/year provided, get all active employees and merge
        if (!employeeId && month && year) {
            const activeEmployees = await User.find({ isActive: true }, 'fullName employeeId department email salary');
            const payrollMap = new Map(payrollRecords.map(p => [p.employeeId._id.toString(), p]));

            const mergedRecords = [];

            for (const emp of activeEmployees) {
                const payroll = payrollMap.get(emp._id.toString());
                if (payroll) {
                    mergedRecords.push({
                        ...payroll.toObject(),
                        employeeId: emp
                    });
                } else {
                    // Create and save pending payroll if it doesn't exist
                    const annualPackage = emp.salary || 0;
                    if (annualPackage > 0) {
                        const monthlySalary = annualPackage / 12;
                        const pfDeduction = monthlySalary * 0.12;
                        const gratuityDeduction = monthlySalary * 0.0481;
                        const totalDeductions = pfDeduction + gratuityDeduction;
                        const totalAdditions = 0; // No additions for pending
                        const totalSalary = monthlySalary - totalDeductions + totalAdditions;
                        const breakdown = {
                            pf: pfDeduction,
                            gratuity: gratuityDeduction,
                            late: 0,
                            absent: 0,
                            benefits: 0,
                            increments: 0,
                            incentives: 0,
                            total: totalSalary
                        };

                        const newPayroll = await Payroll.create({
                            employeeId: emp._id,
                            month: parseInt(month),
                            year: parseInt(year),
                            baseSalary: monthlySalary,
                            deductions: totalDeductions,
                            additions: totalAdditions,
                            totalSalary: totalSalary,
                            status: 'pending',
                            paymentDate: null,
                            notes: JSON.stringify(breakdown)
                        });

                        mergedRecords.push({
                            ...newPayroll.toObject(),
                            employeeId: emp
                        });
                    } else {
                        // No salary set, create computed record without saving
                        mergedRecords.push({
                            employeeId: emp,
                            month: parseInt(month),
                            year: parseInt(year),
                            baseSalary: 0,
                            deductions: 0,
                            additions: 0,
                            totalSalary: 0,
                            status: 'pending',
                            paymentDate: null,
                            notes: JSON.stringify({
                                pf: 0,
                                gratuity: 0,
                                late: 0,
                                absent: 0,
                                benefits: 0,
                                increments: 0,
                                incentives: 0,
                                total: 0
                            })
                        });
                    }
                }
            }

            res.status(200).json(mergedRecords);
        } else {
            res.status(200).json(payrollRecords);
        }
    } catch (error) {
        console.error('Error fetching all payroll:', error);
        res.status(500).json({ message: 'Server error fetching payroll.' });
    }
};

/**
 * Update payroll status.
 * @route PUT /api/payroll/:id/status
 */
exports.updatePayrollStatus = async (req, res) => {
    const { id } = req.params;
    const { status, paymentDate } = req.body;

    if (!id || id === 'undefined') {
        return res.status(400).json({ message: 'Invalid payroll ID.' });
    }

    if (!['pending', 'processed', 'paid', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
    }

    try {
        const updateData = { status };
        if (status === 'paid' && paymentDate) {
            updateData.paymentDate = new Date(paymentDate);
        }
        if (status === 'rejected' && req.body.notes) {
            updateData.notes = req.body.notes;
        }

        const payroll = await Payroll.findByIdAndUpdate(id, updateData, { new: true });

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll record not found.' });
        }

        res.status(200).json({
            message: 'Payroll status updated successfully.',
            payroll
        });
    } catch (error) {
        console.error('Error updating payroll status:', error);
        res.status(500).json({ message: 'Server error updating payroll status.' });
    }
};

/**
 * Submit benefit request from employee.
 * @route POST /api/payroll/benefit-request
 */
exports.submitBenefitRequest = async (req, res) => {
    const { employeeId, benefitType, description, amount } = req.body;

    if (!employeeId || !benefitType || !description) {
        return res.status(400).json({ message: 'Employee ID, benefit type, and description are required.' });
    }

    try {
        const BenefitRequest = require('../models/benefitRequestModel');

        const request = await BenefitRequest.create({
            employeeId,
            benefitType,
            description,
            amount
        });

        res.status(201).json({
            message: 'Benefit request submitted successfully.',
            request
        });
    } catch (error) {
        console.error('Error submitting benefit request:', error);
        res.status(500).json({ message: 'Server error submitting benefit request.' });
    }
};

/**
 * Get benefit requests for an employee.
 * @route GET /api/payroll/benefit-requests/employee/:employeeId
 */
exports.getEmployeeBenefitRequests = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const BenefitRequest = require('../models/benefitRequestModel');

        const requests = await BenefitRequest.find({ employeeId }).sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching benefit requests:', error);
        res.status(500).json({ message: 'Server error fetching benefit requests.' });
    }
};

/**
 * Get all benefit requests for HR approval.
 * @route GET /api/payroll/benefit-requests/all
 */
exports.getAllBenefitRequests = async (req, res) => {
    const { status } = req.query;

    try {
        const BenefitRequest = require('../models/benefitRequestModel');

        const query = {};
        if (status) {
            query.status = status;
        }

        const requests = await BenefitRequest.find(query)
            .populate('employeeId', 'fullName employeeId department')
            .populate('approvedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching all benefit requests:', error);
        res.status(500).json({ message: 'Server error fetching benefit requests.' });
    }
};

/**
 * Handle benefit request approval/rejection.
 * @route PUT /api/payroll/benefit-request/:id/status
 */
exports.handleBenefitRequest = async (req, res) => {
    const { id } = req.params;
    const { status, hrComments, approvedBy } = req.body;

    if (!['approved', 'declined'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or declined.' });
    }

    try {
        const BenefitRequest = require('../models/benefitRequestModel');

        const request = await BenefitRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: 'Benefit request not found.' });
        }

        request.status = status;
        request.hrComments = hrComments;
        request.approvedBy = approvedBy;
        request.approvedAt = new Date();

        await request.save();

        res.status(200).json({
            message: `Benefit request ${status}.`,
            request
        });
    } catch (error) {
        console.error('Error handling benefit request:', error);
        res.status(500).json({ message: 'Server error handling benefit request.' });
    }
};

/**
 * Get detailed payroll breakdown for an employee.
 * @route GET /api/payroll/breakdown/:employeeId/:month/:year
 */
exports.getPayrollBreakdown = async (req, res) => {
    const { employeeId, month, year } = req.params;

    try {
        const payroll = await Payroll.findOne({ employeeId, month: parseInt(month), year: parseInt(year) });

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found.' });
        }

        const breakdown = JSON.parse(payroll.notes || '{}');

        res.status(200).json({
            employeeId: payroll.employeeId,
            month: payroll.month,
            year: payroll.year,
            baseSalary: payroll.baseSalary,
            deductions: payroll.deductions,
            additions: payroll.additions,
            totalSalary: payroll.totalSalary,
            breakdown
        });
    } catch (error) {
        console.error('Error fetching payroll breakdown:', error);
        res.status(500).json({ message: 'Server error fetching payroll breakdown.' });
    }
};
