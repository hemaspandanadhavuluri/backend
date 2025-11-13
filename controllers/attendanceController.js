const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');

/**
 * Mark attendance for employee.
 * @route POST /api/attendance/mark
 */
exports.markAttendance = async (req, res) => {
    const { employeeId, checkInTime, checkOutTime } = req.body;

    if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required.' });
    }

    try {
        // Use a date range for today's records to avoid mismatches due to timezone/serialization.
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        // Check if attendance already exists for today (range search)
        let attendance = await Attendance.findOne({
            employeeId,
            date: { $gte: startOfDay, $lt: endOfDay }
        });

        if (attendance) {
            // Update existing attendance
            if (checkInTime) {
                attendance.checkInTime = new Date(checkInTime);
            }
            if (checkOutTime) {
                attendance.checkOutTime = new Date(checkOutTime);
            }
        } else {
            // Create new attendance record — store date as startOfDay for consistency
            attendance = new Attendance({
                employeeId,
                date: startOfDay,
                checkInTime: checkInTime ? new Date(checkInTime) : null,
                checkOutTime: checkOutTime ? new Date(checkOutTime) : null
            });
        }

        // Calculate status and work hours
    const officeStartTime = new Date(startOfDay);
        officeStartTime.setHours(10, 0, 0, 0); // 10:00 AM

        if (attendance.checkInTime) {
            const checkIn = new Date(attendance.checkInTime);
            const lateThreshold = new Date(officeStartTime.getTime() + 60 * 60 * 1000); // 11:00 AM (1 hour grace)

            if (checkIn > lateThreshold) {
                attendance.status = 'late';
                attendance.isLate = true;
                attendance.lateMinutes = Math.floor((checkIn - officeStartTime) / (1000 * 60));
            } else {
                attendance.status = 'present';
            }

            // Calculate work hours if both check-in and check-out exist
            if (attendance.checkOutTime) {
                const checkOut = new Date(attendance.checkOutTime);
                const workHours = (checkOut - checkIn) / (1000 * 60 * 60); // Convert to hours
                attendance.workHours = Math.max(0, workHours);

                // Check if worked minimum 9 hours
                if (workHours >= 9) {
                    if (attendance.status !== 'late') {
                        attendance.status = 'present';
                    }
                } else if (workHours < 9 && workHours > 0) {
                    if (attendance.status !== 'late') {
                        attendance.status = 'half-day';
                    }
                }
            }
        } else {
            attendance.status = 'absent';
        }

        await attendance.save();

        // Update user's deductions/additions based on attendance
        const user = await User.findById(employeeId);
        if (user) {
            let deductions = user.deductions || 0;
            let additions = user.additions || 0;

            // Calculate monthly late minutes for penalty
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

            const monthlyAttendance = await Attendance.find({
                employeeId,
                date: { $gte: startOfMonth, $lt: endOfMonth },
                isLate: true
            });

            const totalLateMinutes = monthlyAttendance.reduce((sum, record) => sum + (record.lateMinutes || 0), 0);

            // Update user's monthly late minutes
            user.monthlyLateMinutes = totalLateMinutes;

            // Penalty: half day salary deduction for each late instance after 60 min grace
            const graceMinutes = 60;
            if (totalLateMinutes > graceMinutes) {
                const excessLateInstances = monthlyAttendance.length; // Each late record after grace
                const halfDaySalary = user.salary / 2;
                deductions += excessLateInstances * halfDaySalary;
            }

            // Extra day payment: if employee works extra day (more than 9 hours), add full day salary
            if (attendance.workHours > 9) {
                additions += user.salary;
            }

            user.deductions = deductions;
            user.additions = additions;
            await user.save();
        }

        res.status(200).json({
            message: 'Attendance marked successfully.',
            attendance
        });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Server error marking attendance.' });
    }
};

/**
 * Get attendance records for an employee.
 * @route GET /api/attendance/employee/:employeeId
 */
exports.getEmployeeAttendance = async (req, res) => {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    try {
        const query = { employeeId };

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);
            query.date = { $gte: startDate, $lt: endDate };
        }

        const attendanceRecords = await Attendance.find(query).sort({ date: -1 });

        res.status(200).json(attendanceRecords);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Server error fetching attendance.' });
    }
};

/**
 * Get attendance statistics for HR dashboard.
 * @route GET /api/attendance/stats
 */
exports.getAttendanceStats = async (req, res) => {
    const { date } = req.query;

    try {
        const queryDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        // Get total active employees (excluding HR)
        const totalEmployees = await User.countDocuments({
            isActive: true,
            role: { $ne: 'hr' }
        });

        // Get attendance records for the date (range search)
        const attendanceRecords = await Attendance.find({ date: { $gte: startOfDay, $lt: endOfDay } })
            .populate('employeeId', 'fullName employeeId department email');

        // Calculate stats
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        attendanceRecords.forEach(record => {
            if (record.status === 'present' || record.status === 'late') {
                presentCount++;
                if (record.status === 'late') lateCount++;
            } else if (record.status === 'absent') {
                absentCount++;
            }
        });

    // Absent count is total employees minus present/late (since absent records may not exist)
    absentCount = totalEmployees - presentCount;

        res.status(200).json({
            totalEmployees,
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            date: startOfDay
        });
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        res.status(500).json({ message: 'Server error fetching attendance stats.' });
    }
};

/**
 * Get all attendance records for HR view.
 * @route GET /api/attendance/all
 */
exports.getAllAttendance = async (req, res) => {
    const { date, employeeId } = req.query;

    try {
        // Get all active employees
        const allEmployees = await User.find({ isActive: true, role: { $ne: 'hr' } }).select('_id fullName employeeId department');

        let attendanceRecords = [];

        if (date) {
            const queryDate = new Date(date);
            const startOfDay = new Date(queryDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startOfDay);
            endOfDay.setDate(endOfDay.getDate() + 1);

            // Get existing attendance records for the date (range search)
            const existingRecords = await Attendance.find({ date: { $gte: startOfDay, $lt: endOfDay } })
                .populate('employeeId', 'fullName employeeId department email');

            // Create a map of existing records by employeeId
            const attendanceMap = new Map();
            existingRecords.forEach(record => {
                attendanceMap.set(record.employeeId._id.toString(), record);
            });

            // For each employee, either use existing record or create default absent record
            attendanceRecords = allEmployees.map(employee => {
                const existing = attendanceMap.get(employee._id.toString());
                if (existing) {
                    return existing;
                } else {
                    return {
                        _id: null,
                        employeeId: employee,
                        date: queryDate,
                        checkInTime: null,
                        checkOutTime: null,
                        status: 'absent',
                        isLate: false,
                        lateMinutes: 0,
                        workHours: 0,
                        overtimeHours: 0,
                        notes: null
                    };
                }
            });
        } else {
            // If no date specified, get all records
            const query = {};
            if (employeeId) {
                query.employeeId = employeeId;
            }

            attendanceRecords = await Attendance.find(query)
                .populate('employeeId', 'fullName employeeId department')
                .sort({ date: -1 });
        }

        res.status(200).json(attendanceRecords);
    } catch (error) {
        console.error('Error fetching all attendance:', error);
        res.status(500).json({ message: 'Server error fetching attendance.' });
    }
};
