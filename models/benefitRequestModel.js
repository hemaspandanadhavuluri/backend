const mongoose = require('mongoose');

const BenefitRequestSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    benefitType: {
        type: String,
        enum: ['health-insurance', 'gym-membership', 'transport-allowance', 'meal-allowance', 'medical-emergency', 'travel-allowance', 'food-card', 'other'],
        required: true
    },
    description: { type: String, required: true },
    amount: { type: Number },
    status: {
        type: String,
        enum: ['pending', 'approved', 'declined'],
        default: 'pending'
    },
    hrComments: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('BenefitRequest', BenefitRequestSchema);
