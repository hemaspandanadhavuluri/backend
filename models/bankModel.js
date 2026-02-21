const mongoose = require('mongoose');

// --- NEW: Sub-schema for Relationship Managers (RMs) ---
const RMSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    region: { 
        type: String, 
        required: true, 
        // Example regions: 'North', 'South', 'East', 'West'
        index: true 
    },
    branch: { type: String },
    empId: { type: String }
}, { _id: false });

const BankSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    // Type of bank: 'public', 'private', or 'nbfc'
    type: { 
        type: String, 
        enum: ['public', 'private', 'nbfc'], 
        default: 'nbfc' 
    },
    // Array of Relationship Managers associated with this bank
    relationshipManagers: { type: [RMSchema], default: [] }
}, { timestamps: true });

// Add compound unique indexes for relationship managers to ensure uniqueness across all banks
BankSchema.index({ 'relationshipManagers.email': 1 }, { unique: true, sparse: true });
BankSchema.index({ 'relationshipManagers.phoneNumber': 1 }, { unique: true, sparse: true });
BankSchema.index({ 'relationshipManagers.empId': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Bank', BankSchema);
