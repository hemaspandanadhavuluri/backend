const Bank = require('../models/bankModel');

/**
 * GET /api/banks - Fetch all tied-up banks
 */
exports.getAllBanks = async (req, res) => {
    try {
        const banks = await Bank.find({}).sort({ name: 1 });
        res.status(200).json(banks);
    } catch (error) {
        console.error('Error fetching banks:', error);
        res.status(500).json({ message: 'Error fetching banks', error });
    }
};