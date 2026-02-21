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
    const { pincode } = req.query;

    if (!pincode) {
        return res.status(400).json({ message: 'Pincode is required for search.' });
    }

    try {
        // Fetch all banks from database
        const banks = await Bank.find({}).lean();
        
        // Transform banks to include relationship managers as "executives"
        const formattedBanks = banks.map(bank => ({
            _id: bank._id,
            name: bank.name,
            type: bank.type,
            relationshipManagers: bank.relationshipManagers || [],
            // Also include a flag to indicate if bank has RMs for this pincode
            hasRMForRegion: (region) => {
                return bank.relationshipManagers?.some(rm => rm.region === region) || false;
            }
        }));

        // Since we don't have branch-level data with pincodes in the current model,
        // we'll return all banks with their RMs for the user to choose from
        // The filtering by pincode can be done on the frontend based on RM regions
        res.status(200).json(formattedBanks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to search banks.', error: error.message });
    }
};

/**
 * 4. GET /api/banks/connected/:type - Fetch connected banks by type (public or private) with RMs
 */
exports.getConnectedBanksByType = async (req, res) => {
    const { type } = req.params; // 'public' or 'private'

    if (!['public', 'private'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type. Must be "public" or "private".' });
    }

    try {
        // Filter banks based on type field in database
        const banks = await Bank.find({ type: type }).sort({ name: 1 });

        // Return banks with their RMs
        const result = banks.map(bank => ({
            _id: bank._id,
            name: bank.name,
            type: bank.type,
            relationshipManagers: bank.relationshipManagers
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch connected banks.', error: error.message });
    }
};

/**
 * 5. POST /api/banks - Create a new bank
 */
exports.createBank = async (req, res) => {
    const { name, type, relationshipManagers } = req.body;

    // Log the incoming request for debugging
    console.log('createBank request body:', req.body);

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Bank name is required.' });
    }

    // Validate and normalize the type
    const validTypes = ['public', 'private', 'nbfc'];
    const normalizedType = type ? type.toString().toLowerCase().trim() : 'public';
    
    if (type && !validTypes.includes(normalizedType)) {
        return res.status(400).json({ 
            message: `Invalid bank type. Must be one of: ${validTypes.join(', ')}` 
        });
    }

    const trimmedName = name.trim();
    const bankData = {
        name: trimmedName,
        type: normalizedType,
        relationshipManagers: relationshipManagers || []
    };

    console.log('Bank data to save:', bankData);

    try {
        // Use findOneAndDelete followed by create to handle race conditions
        // First, try to delete any existing bank with this name (soft delete approach)
        // Then create fresh - this avoids unique index conflicts
        
        // Alternative: Use insertMany with ordered: false to bypass duplicate check
        // But first let's just try a simple save with explicit handling
        
        // Check if bank exists
        const existingBank = await Bank.findOne({ name: trimmedName });
        
        if (existingBank) {
            return res.status(400).json({ 
                message: `Bank "${trimmedName}" already exists. Please use a different name.` 
            });
        }

        // Create and save the new bank
        const newBank = new Bank(bankData);
        await newBank.save();
        
        console.log('Bank saved successfully:', newBank);
        res.status(201).json(newBank);
        
    } catch (error) {
        // Log the full error for debugging
        console.error('Error creating bank:', error);
        console.error('Error code:', error.code);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        // Check for duplicate key error (code 11000)
        if (error.code === 11000) {
            // Parse which field caused the duplicate
            const duplicateField = error.message.includes('name') ? 'name' : 'unknown';
            return res.status(400).json({ 
                message: `A bank with this ${duplicateField} already exists. Please use a different ${duplicateField}.` 
            });
        } 
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationMessages = Object.values(error.errors).map(err => err.message).join(', ');
            return res.status(400).json({ message: `Validation error: ${validationMessages}` });
        }
        
        // Handle CastError (invalid ObjectId, etc)
        if (error.name === 'CastError') {
            return res.status(400).json({ message: `Invalid data format: ${error.message}` });
        }
        
        // Generic server error
        res.status(500).json({ message: 'Failed to create bank.', error: error.message });
    }
};

/**
 * 6. PUT /api/banks/:id - Update a bank
 */
exports.updateBank = async (req, res) => {
    const { id } = req.params;
    const { name, type, relationshipManagers } = req.body;

    try {
        const updatedBank = await Bank.findByIdAndUpdate(
            id,
            { name, type, relationshipManagers },
            { new: true, runValidators: true }
        );

        if (!updatedBank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        res.status(200).json(updatedBank);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update bank.', error: error.message });
    }
};

/**
 * 7. DELETE /api/banks/:id - Delete a bank
 */
exports.deleteBank = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedBank = await Bank.findByIdAndDelete(id);

        if (!deletedBank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        res.status(200).json({ message: 'Bank deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete bank.', error: error.message });
    }
};

/**
 * 8. POST /api/banks/:id/rm - Add a Relationship Manager to a bank
 */
exports.addRelationshipManager = async (req, res) => {
    const { id } = req.params;
    const { name, email, phoneNumber, region, branch, empId } = req.body;

    if (!name || !email || !phoneNumber || !region) {
        return res.status(400).json({ message: 'Name, email, phone number, and region are required.' });
    }

    try {
        const bank = await Bank.findById(id);
        if (!bank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        // Check if email already exists in any bank's relationship managers
        const existingBankWithEmail = await Bank.findOne({
            'relationshipManagers.email': email
        });

        if (existingBankWithEmail) {
            return res.status(400).json({ 
                message: `A Relationship Manager with email "${email}" already exists.` 
            });
        }

        // Check if phoneNumber already exists in any bank's relationship managers
        const existingBankWithPhone = await Bank.findOne({
            'relationshipManagers.phoneNumber': phoneNumber
        });

        if (existingBankWithPhone) {
            return res.status(400).json({ 
                message: `A Relationship Manager with phone number "${phoneNumber}" already exists.` 
            });
        }

        // Also check if phoneNumber already exists within this specific bank
        const phoneExistsInThisBank = bank.relationshipManagers.some(
            rm => rm.phoneNumber === phoneNumber
        );

        if (phoneExistsInThisBank) {
            return res.status(400).json({ 
                message: `A Relationship Manager with phone number "${phoneNumber}" already exists in this bank.` 
            });
        }

        // Also check if email already exists within this specific bank
        const emailExistsInThisBank = bank.relationshipManagers.some(
            rm => rm.email === email
        );

        if (emailExistsInThisBank) {
            return res.status(400).json({ 
                message: `A Relationship Manager with email "${email}" already exists in this bank.` 
            });
        }

        // Check if empId already exists in any bank's relationship managers (if empId is provided)
        if (empId) {
            const existingBankWithEmpId = await Bank.findOne({
                'relationshipManagers.empId': empId
            });

            if (existingBankWithEmpId) {
                return res.status(400).json({ 
                    message: `A Relationship Manager with employee ID "${empId}" already exists.` 
                });
            }

            // Also check within this specific bank
            const empIdExistsInThisBank = bank.relationshipManagers.some(
                rm => rm.empId === empId
            );

            if (empIdExistsInThisBank) {
                return res.status(400).json({ 
                    message: `A Relationship Manager with employee ID "${empId}" already exists in this bank.` 
                });
            }
        }

        // Check if email and phoneNumber are the same
        if (email === phoneNumber) {
            return res.status(400).json({ 
                message: 'Email and phone number cannot be the same.' 
            });
        }

        const newRM = { name, email, phoneNumber, region, branch: branch || '', empId: empId || '' };
        bank.relationshipManagers.push(newRM);
        await bank.save();

        res.status(201).json({ message: 'Relationship Manager added successfully.', bank });
    } catch (error) {
        // Check for duplicate key error (code 11000) from database unique index
        if (error.code === 11000) {
            if (error.message.includes('email')) {
                return res.status(400).json({ 
                    message: `A Relationship Manager with email "${email}" already exists.` 
                });
            }
            if (error.message.includes('phoneNumber')) {
                return res.status(400).json({ 
                    message: `A Relationship Manager with phone number "${phoneNumber}" already exists.` 
                });
            }
            return res.status(400).json({ 
                message: 'A Relationship Manager with this email or phone number already exists.' 
            });
        }
        res.status(500).json({ message: 'Failed to add Relationship Manager.', error: error.message });
    }
};

/**
 * 9. PUT /api/banks/:id/rm/:rmId - Update a Relationship Manager
 */
exports.updateRelationshipManager = async (req, res) => {
    const { id, rmId } = req.params;
    const { name, email, phoneNumber, region, branch, empId } = req.body;

    try {
        const bank = await Bank.findById(id);
        if (!bank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        const rmIndex = bank.relationshipManagers.findIndex(rm => rm._id.toString() === rmId);
        if (rmIndex === -1) {
            return res.status(404).json({ message: 'Relationship Manager not found.' });
        }

        bank.relationshipManagers[rmIndex] = {
            ...bank.relationshipManagers[rmIndex].toObject(),
            name: name || bank.relationshipManagers[rmIndex].name,
            email: email || bank.relationshipManagers[rmIndex].email,
            phoneNumber: phoneNumber || bank.relationshipManagers[rmIndex].phoneNumber,
            region: region || bank.relationshipManagers[rmIndex].region,
            branch: branch !== undefined ? branch : bank.relationshipManagers[rmIndex].branch,
            empId: empId !== undefined ? empId : bank.relationshipManagers[rmIndex].empId
        };

        await bank.save();
        res.status(200).json({ message: 'Relationship Manager updated successfully.', bank });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update Relationship Manager.', error: error.message });
    }
};

/**
 * 10. DELETE /api/banks/:id/rm/:rmId - Delete a Relationship Manager
 */
exports.deleteRelationshipManager = async (req, res) => {
    const { id, rmId } = req.params;

    try {
        const bank = await Bank.findById(id);
        if (!bank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        const rmIndex = bank.relationshipManagers.findIndex(rm => rm._id.toString() === rmId);
        if (rmIndex === -1) {
            return res.status(404).json({ message: 'Relationship Manager not found.' });
        }

        bank.relationshipManagers.splice(rmIndex, 1);
        await bank.save();

        res.status(200).json({ message: 'Relationship Manager deleted successfully.', bank });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete Relationship Manager.', error: error.message });
    }
};
