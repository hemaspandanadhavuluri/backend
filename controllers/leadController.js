// src/controllers/leadController.js
const Lead = require('../models/leadModel');
const mongoose = require('mongoose');

// Helper to generate a unique Lead ID (e.g., a simple counter or UUID/timestamp based)
const generateUniqueLeadID = () => {
    return 'L-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();
};

/**
 * 1. GET /api/leads - Fetch all leads based on user role (Access Control)
 */

const MOCK_USER_FOR_TESTING = {
    role: 'FO', // Change this role (e.g., 'CEO', 'ZonalHead') to test access
    region: 'West',
    zone: 'North',
    id: '650a3d4d4281f6233d67450c' // A dummy FO ObjectId (Must be a valid 24-char ID)
};


// src/controllers/leadController.js

// ... (imports and helper functions remain the same)

/**
 * 1. GET /api/leads - Fetch all leads based on user role (Access Control)
 */
exports.getAllLeads = async (req, res) => {
    // ** 🔄 CRITICAL CHANGE HERE: Read user data from query parameters (req.query) 🔄 **
    // The frontend sends this data via URL query params, e.g., /api/leads?userId=...&role=...
    const { userId, role, region, zone } = req.query;

    // Fallback/Mock for local testing (optional, but good for quick testing)
    const user = { 
        id: userId || MOCK_USER_FOR_TESTING.id, 
        role: role || MOCK_USER_FOR_TESTING.role, 
        region: region || MOCK_USER_FOR_TESTING.region, 
        zone: zone || MOCK_USER_FOR_TESTING.zone 
    };

    // If a request comes without basic user info (which shouldn't happen with the frontend change)
    if (!user.role || (user.role === 'FO' && !user.id)) {
        return res.status(403).json({ message: 'Access Denied: Missing user identification for filtering.' });
    }

    // Use the values extracted from the query parameters
    let filter = {};

    // Build the query filter based on the user's role
    if (user.role === 'CEO') {
        filter = {}; // CEO sees all leads
    } else if (user.role === 'ZonalHead') {
        filter = { zone: user.zone };
    } else if (user.role === 'RegionalHead') {
        filter = { region: user.region };
    } else if (user.role === 'FO') {
        // Ensure userId exists before creating ObjectId
        if (!user.id) {
            return res.status(500).json({ message: 'Error: FO role requires a valid ID.' });
        }
        // NOTE: userId comes from the query string
        filter = { assignedFOId: new mongoose.Types.ObjectId(user.id) }; 
    } else {
        return res.status(403).json({ message: 'Access Denied: Role not authorized to view leads.' });
    }

    try {
        const leads = await Lead.find(filter)
            .select('leadID fullName leadStatus assignedFO reminderCallDate zone region loanType')
            .sort({ reminderCallDate: 1, createdAt: -1 });

        res.status(200).json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: 'Error fetching leads', error });
    }
};


exports.createLead = async (req, res) => {
    const { fullName, mobileNumbers, source,zone,region,assignedFOId,assignedFO,assignedFOPhone } = req.body;

    if (!fullName || !mobileNumbers || mobileNumbers.length === 0 || !source || !source.source) {
        return res.status(400).json({ message: 'Required fields: Full Name, Mobile Number(s), and Source Type.' });
    }

    try {
        const lead = new Lead({
            ...req.body,
            leadID: generateUniqueLeadID(),
            leadStatus: 'New',
            assignedFOId: assignedFOId,
            assignedFO: assignedFO,
            assignedFOPhone: assignedFOPhone,
            zone: zone,
            region: region,
        });

        const createdLead = await lead.save();
        res.status(201).json(createdLead);
    } catch (error) {
        // Handle unique constraint error on leadID
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Lead creation failed: Duplicate Lead ID generated.' });
        }
        res.status(400).json({ message: 'Failed to create lead.', error: error.message });
    }
};

/**
 * 3. GET /api/leads/:id - Fetch a specific lead
 */
const MOCK_USER_FOR_TESTING1 = {
    role: 'FO', // <--- IMPORTANT: Change this role to test different access cases
    region: 'West',
    zone: 'North',
    id: '650a3d4d4281f6233d67450c' // A valid 24-char ObjectId for testing FO access
};
exports.getLeadById = async (req, res) => {
    const { id } = req.params ||MOCK_USER_FOR_TESTING1 ;
    const lead = await Lead.findById(id);

    if (!lead) {
        return res.status(404).json({ message: 'Lead not found.' });
    }
    
    // **Access Control Check for Single Lead:**
    const { role, region, zone, id: userId } = req.user || MOCK_USER_FOR_TESTING1;
    const leadZone = lead.zone;
    const leadRegion = lead.region;
    const leadFOId = lead.assignedFOId ? lead.assignedFOId.toString() : null;

    if (role === 'CEO' || 
        (role === 'ZonalHead' && leadZone === zone) || 
        (role === 'RegionalHead' && leadRegion === region) || 
        (role === 'FO' && leadFOId === userId)) {
        
        return res.status(200).json(lead);
    }

    res.status(403).json({ message: 'Access Denied: You do not have permission to view this lead.' });
};

/**
 * 4. PUT /api/leads/:id - Update a specific lead
 */
const MOCK_USER_FOR_TESTING2 = {
    role: 'FO', // <--- IMPORTANT: Change this role to test different access cases
    region: 'West',
    zone: 'North',
    id: '650a3d4d4281f6233d67450c' // A valid 24-char ObjectId for testing FO access
};
exports.updateLead = async (req, res) => {
    const { id } = req.params || MOCK_USER_FOR_TESTING2 ;
    const updateData = req.body;
    
    // 5. Logic: Check for new referrals and create new leads
    const referralList = updateData.referralList || [];
    
    // Process referrals if the list has new valid entries
    if (referralList.length > 0) {
        for (const referral of referralList) {
            if (referral.name && referral.phoneNumber) {
                // Ensure this is not a lead already processed (optional, but good practice)
                
                try {
                    const newReferralLead = new Lead({
                        leadID: generateUniqueLeadID(),
                        fullName: referral.name,
                        mobileNumbers: [referral.phoneNumber],
                        source: {
                            source: 'Referral',
                            name: req.body.fullName || 'Unknown Student', // Use the current lead's name as source
                            phoneNumber: req.body.mobileNumbers[0] || '',
                        },
                        // Assign the new referral lead to the current user (the FO who got the referral)
                        assignedFOId: req.user.id,
                        assignedFO: req.user.fullName,
                        leadStatus: 'New',
                    });

                    await newReferralLead.save();
                    console.log(`Created new lead from referral: ${newReferralLead.fullName}`);

                } catch (e) {
                    console.error('Error creating referral lead:', e);
                    // Do not fail the main update if referral creation fails
                }
            }
        }
    }
    
    // Perform the main lead update
    try {
        const updatedLead = await Lead.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedLead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }
        
        // Re-run the single-lead access check before responding (to prevent security hole)
        const { role, region, zone, id: userId } = req.user || MOCK_USER_FOR_TESTING2;
        const leadFOId = updatedLead.assignedFOId ? updatedLead.assignedFOId.toString() : null;
        if (role === 'CEO' || (role === 'FO' && leadFOId === userId) || (role === 'RegionalHead' && updatedLead.region === region)) {
             return res.status(200).json(updatedLead);
        }

        res.status(403).json({ message: 'Access Denied to update this lead.' });

    } catch (error) {
        res.status(400).json({ message: 'Failed to update lead.', error: error.message });
    }
};