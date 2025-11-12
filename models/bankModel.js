const mongoose = require('mongoose');

// --- NEW: Sub-schema for Relationship Managers (RMs) ---
const RMSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, // Ensure 'unique: true' is removed
    phoneNumber: { type: String, required: true },
    region: { 
        type: String, 
        required: true, 
        // Example regions: 'North', 'South', 'East', 'West'
        index: true 
    }
}, { _id: false });

const BankSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    // Array of Relationship Managers associated with this bank
    relationshipManagers: { type: [RMSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Bank', BankSchema);