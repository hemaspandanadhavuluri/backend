const Bank = require('../models/bankModel');

/**
 * 1. GET /api/banks - Fetch all tied-up banks
 */
exports.getAllBanks = async (req, res) => {
    try {
        const banks = await Bank.find({}).sort({ name: 1 });
        res.status(200).json(banks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch banks.', error: error.message });
    }
};

/**
 * 2. GET /api/banks/for-university - Fetch prime banks for a university
 */
exports.getBanksForUniversity = async (req, res) => {
    const { universityName } = req.query;
    if (!universityName) {
        return res.status(400).json({ message: 'University name is required.' });
    }
    try {
        // This logic assumes a 'primeUniversities' field in your Bank model
        const banks = await Bank.find({ primeUniversities: universityName });
        res.status(200).json(banks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch banks for university.', error: error.message });
    }
};

/**
 * 3. GET /api/banks/search-by-pincode - Search for banks by pincode
 */
exports.searchBanksByPincode = async (req, res) => {
    // --- USING DUMMY DATA AS REQUESTED ---
    const { pincode } = req.query; // e.g., "522005" or "500081"

    if (!pincode) {
        return res.status(400).json({ message: 'Pincode is required for search.' });
    }

const allBanks = [
    {
        _id: 'bank_sbi',
        name: 'State Bank of India',
        branches: [
            {
                branchName: 'Guntur Main Branch',
                ifsc: 'SBIN0000843',
                address: 'Brodipet, Guntur',
                city: 'Guntur',
                district: 'Guntur',
                state: 'Andhra Pradesh',
                pincode: '522002'
            },
            {
                branchName: 'Lakshmipuram',
                ifsc: 'SBIN0011234',
                address: 'Lakshmipuram Main Road',
                city: 'Guntur',
                district: 'Guntur',
                state: 'Andhra Pradesh',
                pincode: '522007'
            },
            {
                branchName: 'Arundelpet',
                ifsc: 'SBIN0014567',
                address: 'Arundelpet 5th Lane',
                city: 'Guntur',
                district: 'Guntur',
                state: 'Andhra Pradesh',
                pincode: '522005'
            }
        ]
    },
    {
        _id: 'bank_pnb',
        name: 'Punjab National Bank',
        branches: [
            {
                branchName: 'Arundelpet',
                ifsc: 'PUNB0123400',
                address: 'Arundelpet, Guntur',
                city: 'Guntur',
                district: 'Guntur',
                state: 'Andhra Pradesh',
                pincode: '522005'
            },
            {
                branchName: 'Brodipet',
                ifsc: 'PUNB0456700',
                address: 'Brodipet Main Road',
                city: 'Guntur',
                district: 'Guntur',
                state: 'Andhra Pradesh',
                pincode: '522002'
            }
        ]
    },
    {
        _id: 'bank_bob',
        name: 'Bank of Baroda',
        branches: [
            {
                branchName: 'Vijayawada Main',
                ifsc: 'BARB0VJAYAW',
                address: 'M.G. Road, Vijayawada',
                city: 'Vijayawada',
                district: 'Krishna',
                state: 'Andhra Pradesh',
                pincode: '520010'
            },
            {
                branchName: 'Benz Circle',
                ifsc: 'BARB0BENZXX',
                address: 'Benz Circle',
                city: 'Vijayawada',
                district: 'Krishna',
                state: 'Andhra Pradesh',
                pincode: '520008'
            }
        ]
    },
    {
        _id: 'bank_canara',
        name: 'Canara Bank',
        branches: [
            {
                branchName: 'Governorpet',
                ifsc: 'CNRB0001234',
                address: 'Governorpet',
                city: 'Vijayawada',
                district: 'Krishna',
                state: 'Andhra Pradesh',
                pincode: '520002'
            },
            {
                branchName: 'Patamata',
                ifsc: 'CNRB0005678',
                address: 'Patamata',
                city: 'Vijayawada',
                district: 'Krishna',
                state: 'Andhra Pradesh',
                pincode: '520010'
            }
        ]
    },
    {
        _id: 'bank_union',
        name: 'Union Bank of India',
        branches: [
            {
                branchName: 'Dwaraka Nagar',
                ifsc: 'UBIN0532100',
                address: 'Dwaraka Nagar',
                city: 'Visakhapatnam',
                district: 'Visakhapatnam',
                state: 'Andhra Pradesh',
                pincode: '530016'
            },
            {
                branchName: 'Madhurawada',
                ifsc: 'UBIN0578900',
                address: 'Madhurawada',
                city: 'Visakhapatnam',
                district: 'Visakhapatnam',
                state: 'Andhra Pradesh',
                pincode: '530048'
            }
        ]
    },
    {
        _id: 'bank_indian',
        name: 'Indian Bank',
        branches: [
            {
                branchName: 'Nellore Main',
                ifsc: 'IDIB000N123',
                address: 'Trunk Road, Nellore',
                city: 'Nellore',
                district: 'SPSR Nellore',
                state: 'Andhra Pradesh',
                pincode: '524001'
            },
            {
                branchName: 'Kavali',
                ifsc: 'IDIB000K456',
                address: 'Kavali Town',
                city: 'Kavali',
                district: 'SPSR Nellore',
                state: 'Andhra Pradesh',
                pincode: '524201'
            }
        ]
    }
];


    // Filter the banks to find ones that have a branch with the matching pincode
    const foundBanks = allBanks.filter(bank =>
        bank.branches.some(branch => branch.pincode === pincode)
    );

    res.status(200).json(foundBanks);
};