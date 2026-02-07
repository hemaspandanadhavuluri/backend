const mongoose = require('mongoose');

const BankComparisonSchema = new mongoose.Schema({
    bankName: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['public', 'private'] },
    disadvantages: [{ type: String, required: true }],
    justTapAdvantages: [{ type: String, required: true }]
}, { timestamps: true });

module.exports = mongoose.model('BankComparison', BankComparisonSchema);
