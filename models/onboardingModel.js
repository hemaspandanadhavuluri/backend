const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    name: { type: String, required: true },
    personalNumber: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },
    profilePictureUrl: { type: String },
    panNumber: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    currentAddress: { type: String, required: true },
    permanentAddress: { type: String },
    fatherName: { type: String },
    fatherDob: { type: Date },
    fatherMobile: { type: String },
    motherName: { type: String },
    motherDob: { type: Date },
    motherMobile: { type: String },
    aadharUpload: { type: String }, // file path
    panUpload: { type: String }, // file path
    // Bank Details
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    accountHolderName: { type: String, required: true },
    bankStatementUpload: { type: String }, // optional file path for bank statement
    // Status
    status: { type: String, enum: ['pending', 'approved', 'issue', 'onboard', 'onboarded'], default: 'pending' },
    issueDetails: { type: String }, // if status is issue, details of what to fix
    submittedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    finalOnboarded: { type: Boolean, default: false },
    finalOnboardSubmitted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Onboarding', onboardingSchema);
