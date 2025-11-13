const mongoose = require('mongoose');

const ProfileEditRequestSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedChanges: {
        fullName: { type: String },
        email: { type: String },
        phoneNumber: { type: String },
        currentAddress: { type: String },
        permanentAddress: { type: String },
        // Add other editable fields as needed
    },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    hrComments: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ProfileEditRequest', ProfileEditRequestSchema);
