const BankComparison = require('../models/bankComparisonModel');

/**
 * 1. GET /api/bank-comparisons - Fetch all bank comparisons
 */
exports.getAllBankComparisons = async (req, res) => {
    try {
        const comparisons = await BankComparison.find({}).sort({ bankName: 1 });
        res.status(200).json(comparisons);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bank comparisons.', error: error.message });
    }
};

/**
 * 2. GET /api/bank-comparisons/:bankName - Fetch comparison for a specific bank
 */
exports.getBankComparisonByName = async (req, res) => {
    const { bankName } = req.params;
    try {
        // First, try to find an exact or partial match (case-insensitive)
        const comparison = await BankComparison.findOne({ bankName: { $regex: bankName, $options: 'i' } });
        if (comparison) {
            return res.status(200).json(comparison);
        }
        // If not found, classify as public or private bank
        const publicBanks = [
            'State Bank of India', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India',
            'Bank of India', 'Indian Bank', 'Central Bank of India', 'UCO Bank', 'Bank of Maharashtra',
            'Punjab & Sind Bank', 'Indian Overseas Bank'
        ];
        const privateBanks = [
            'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'IndusInd Bank', 'Yes Bank',
            'Federal Bank', 'IDFC First Bank', 'Bandhan Bank', 'RBL Bank', 'South Indian Bank', 'City Union Bank',
            'Karur Vysya Bank', 'Tamilnad Mercantile Bank', 'Karnataka Bank', 'Nainital Bank', 'Dhanlaxmi Bank',
            'Jammu & Kashmir Bank', 'Saraswat Cooperative Bank', 'Abhyudaya Cooperative Bank', 'Bharat Cooperative Bank',
            'Catholic Syrian Bank', 'DCB Bank', 'ESAF Small Finance Bank', 'Equitas Small Finance Bank',
            'Fincare Small Finance Bank', 'Jana Small Finance Bank', 'North East Small Finance Bank',
            'Shivalik Small Finance Bank', 'Suryoday Small Finance Bank', 'Ujjivan Small Finance Bank',
            'Utkarsh Small Finance Bank', 'AU Small Finance Bank', 'Capital Small Finance Bank',
            'FINO Payments Bank', 'India Post Payments Bank', 'Jio Payments Bank', 'NSDL Payments Bank',
            'Paytm Payments Bank', 'Airtel Payments Bank'
        ];

        const isPublic = publicBanks.some(pb => bankName.toLowerCase().includes(pb.toLowerCase()) || pb.toLowerCase().includes(bankName.toLowerCase()));
        const isPrivate = privateBanks.some(pb => bankName.toLowerCase().includes(pb.toLowerCase()) || pb.toLowerCase().includes(bankName.toLowerCase()));
        const classification = isPublic ? 'Public Banks' : (isPrivate ? 'Private Banks' : 'Private Banks');
        const fallbackComparison = await BankComparison.findOne({ bankName: classification });
        if (fallbackComparison) {
            return res.status(200).json(fallbackComparison);
        }
        return res.status(404).json({ message: 'Bank comparison not found.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bank comparison.', error: error.message });
    }
};

/**
 * 3. POST /api/bank-comparisons - Create a new bank comparison
 */
exports.createBankComparison = async (req, res) => {
    const { bankName, disadvantages, justTapAdvantages } = req.body;
    try {
        const newComparison = new BankComparison({
            bankName,
            disadvantages,
            justTapAdvantages
        });
        await newComparison.save();
        res.status(201).json(newComparison);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create bank comparison.', error: error.message });
    }
};

/**
 * 4. PUT /api/bank-comparisons/:bankName - Update a bank comparison
 */
exports.updateBankComparison = async (req, res) => {
    const { bankName } = req.params;
    const { disadvantages, justTapAdvantages } = req.body;
    try {
        const updatedComparison = await BankComparison.findOneAndUpdate(
            { bankName },
            { disadvantages, justTapAdvantages },
            { new: true }
        );
        if (!updatedComparison) {
            return res.status(404).json({ message: 'Bank comparison not found.' });
        }
        res.status(200).json(updatedComparison);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update bank comparison.', error: error.message });
    }
};

/**
 * 5. DELETE /api/bank-comparisons/:bankName - Delete a bank comparison
 */
exports.deleteBankComparison = async (req, res) => {
    const { bankName } = req.params;
    try {
        const deletedComparison = await BankComparison.findOneAndDelete({ bankName });
        if (!deletedComparison) {
            return res.status(404).json({ message: 'Bank comparison not found.' });
        }
        res.status(200).json({ message: 'Bank comparison deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete bank comparison.', error: error.message });
    }
};

/**
 * 6. GET /api/bank-comparisons/type/public - Fetch all public bank comparisons
 */
exports.getPublicBankComparisons = async (req, res) => {
    try {
        const comparisons = await BankComparison.find({ type: 'public' }).sort({ bankName: 1 });
        res.status(200).json(comparisons);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch public bank comparisons.', error: error.message });
    }
};

/**
 * 7. GET /api/bank-comparisons/type/private - Fetch all private bank comparisons
 */
exports.getPrivateBankComparisons = async (req, res) => {
    try {
        const comparisons = await BankComparison.find({ type: 'private' }).sort({ bankName: 1 });
        res.status(200).json(comparisons);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch private bank comparisons.', error: error.message });
    }
};
