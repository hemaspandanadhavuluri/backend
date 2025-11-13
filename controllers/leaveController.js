const LeaveRequest = require('../models/leaveRequestModel');
const User = require('../models/userModel');

/**
 * Submit leave request from employee.
 * @route POST /api/leave/request
 */
exports.submitLeaveRequest = async (req, res) => {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Check leave balance for annual leave
        if (leaveType === 'annual') {
            const user = await User.findById(employeeId);
            if (user && user.leaveBalance < totalDays) {
                return res.status(400).json({ message: 'Insufficient leave balance.' });
            }
        }

        const leaveRequest = await LeaveRequest.create({
            employeeId,
            leaveType,
            startDate: start,
            endDate: end,
            totalDays,
            reason
        });

        res.status(201).json({
            message: 'Leave request submitted successfully.',
            leaveRequest
        });
    } catch (error) {
        console.error('Error submitting leave request:', error);
        res.status(500).json({ message: 'Server error submitting leave request.' });
    }
};

/**
 * Get leave requests for an employee.
 * @route GET /api/leave/employee/:employeeId
 */
exports.getEmployeeLeaveRequests = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const leaveRequests = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 });

        res.status(200).json(leaveRequests);
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({ message: 'Server error fetching leave requests.' });
    }
};

/**
 * Get all leave requests for HR approval.
 * @route GET /api/leave/all
 */
exports.getAllLeaveRequests = async (req, res) => {
    const { status } = req.query;

    try {
        const query = {};
        if (status) {
            query.status = status;
        }

        const leaveRequests = await LeaveRequest.find(query)
            .populate('employeeId', 'fullName employeeId department')
            .populate('approvedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json(leaveRequests);
    } catch (error) {
        console.error('Error fetching all leave requests:', error);
        res.status(500).json({ message: 'Server error fetching leave requests.' });
    }
};

/**
 * Approve or reject leave request.
 * @route PUT /api/leave/:id/status
 */
exports.handleLeaveRequest = async (req, res) => {
    const { id } = req.params;
    const { status, hrComments, approvedBy } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    try {
        const leaveRequest = await LeaveRequest.findById(id).populate('employeeId');

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found.' });
        }

        leaveRequest.status = status;
        leaveRequest.hrComments = hrComments;
        leaveRequest.approvedBy = approvedBy;
        leaveRequest.approvedAt = new Date();

        // If approved and annual leave, deduct from leave balance
        if (status === 'approved' && leaveRequest.leaveType === 'annual') {
            const user = await User.findById(leaveRequest.employeeId);
            if (user) {
                user.leaveBalance = Math.max(0, user.leaveBalance - leaveRequest.totalDays);
                await user.save();
            }
        }

        await leaveRequest.save();

        res.status(200).json({
            message: `Leave request ${status}.`,
            leaveRequest
        });
    } catch (error) {
        console.error('Error handling leave request:', error);
        res.status(500).json({ message: 'Server error handling leave request.' });
    }
};
