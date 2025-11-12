const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In a real app, this would be a hashed password
    phoneNumber: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    panNumber: { type: String },
    aadharNumber: { type: String },
    currentAddress: { type: String },
    permanentAddress: { type: String },
    fatherName: { type: String },
    fatherDob: { type: Date },
    fatherMobile: { type: String },
    motherName: { type: String },
    motherDob: { type: Date },
    motherMobile: { type: String },
    aadharFilePath: { type: String },
    panFilePath: { type: String },
    profilePictureUrl: { type: String },

    // Role for Access Control
    role: {
        type: String,
        enum: ['CEO', 'ZonalHead', 'RegionalHead', 'FO', 'HR', 'BankExecutive'],
        required: true
    },

    // Hierarchy Fields (used for filtering leads)
    zone: { type: String, index: true },
    region: { type: String, index: true },
    // NEW: Field to associate a user with a bank
    bank: { type: String, index: true },

    // Reporting Hierarchy
    reporting_hr: { type: String },
    reporting_fo: { type: String },
    reporting_zonalHead: { type: String },
    reporting_regionalHead: { type: String },
    reporting_ceo: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
