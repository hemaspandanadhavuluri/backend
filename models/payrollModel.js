const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    additions: { type: Number, default: 0 },
    totalSalary: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processed', 'paid', 'rejected'],
        default: 'pending'
    },
    paymentDate: { type: Date },
    notes: { type: String }
}, { timestamps: true });

// Compound index for unique payroll per employee per month/year
PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
