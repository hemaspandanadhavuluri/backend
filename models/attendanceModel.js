const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half-day'],
        default: 'absent'
    },
    isLate: { type: Boolean, default: false },
    lateMinutes: { type: Number, default: 0 },
    workHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    notes: { type: String }
}, { timestamps: true });

// Compound index to ensure one attendance record per employee per date
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
