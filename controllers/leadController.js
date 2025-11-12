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
exports.getAllLeads = async (req, res) => {
    // ** 🔄 CRITICAL CHANGE HERE: Read user data from query parameters (req.query) 🔄 **
    // The frontend sends this data via URL query params, e.g., /api/leads?userId=...&role=...
    const { userId, role, region, zone, bank } = req.query;

    // The user object is now constructed directly from the frontend request query.
    // No more mock data fallback.
    const user = { id: userId, role, region, zone, bank };

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
    } else if (user.role === 'BankExecutive') {
        filter = { 'assignedBanks.bankName': user.bank };
    } else {
        return res.status(403).json({ message: 'Access Denied: Role not authorized to view leads.' });
    }

    try {
        const leads = await Lead.find(filter)
            .sort({ reminderCallDate: 1, createdAt: -1 });

        res.status(200).json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: 'Error fetching leads', error });
    }
};


exports.createLead = async (req, res) => {
    const { fullName, mobileNumbers, source,zone,region,assignedFOId,assignedFO,assignedFOPhone } = req.body;

    if (!fullName || !mobileNumbers || mobileNumbers.length === 0 || !source || !source?.source) {
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
exports.getLeadById = async (req, res) => {
    const { id } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
        return res.status(404).json({ message: 'Lead not found.' });
    }
    
    // For now, we are skipping the access control check for a single lead.
    // This can be re-added later with a proper authentication middleware.
    return res.status(200).json(lead);
};

/**
 * 4. PUT /api/leads/:id - Update a specific lead
 */
exports.updateLead = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
        
    // --- FIX: Preserve the 'source' field if it's not in the update payload ---
    // The `source` field is required by the schema, but may not be sent on every
    // update from the form. This ensures we don't wipe it out.
    if (!updateData.source || !updateData.source.source) {
        try {
            const existingLead = await Lead.findById(id).select('source').lean();
            if (existingLead && existingLead.source) {
                updateData.source = existingLead.source;
            }
        } catch (e) { /* If find fails, let the update proceed and likely fail validation, which is ok */ }
    }

    // --- FIX: Handle new call notes ---
    // If a new note is part of the payload, add it to the call history array.
    if (updateData.newCallNote && updateData.newCallNote.notes) {
        // NOTE: The loggedById and loggedByName should come from `req.user` 
        // which is populated by an authentication middleware (e.g., JWT).
        const newNote = {
            loggedById: new mongoose.Types.ObjectId('65f16e6772e62b5a85593b89'), // Placeholder ID, replace with req.user._id
            loggedByName: 'Current User', // Placeholder Name, replace with req.user.fullName
            notes: updateData.newCallNote.notes,
            callStatus: updateData.newCallNote.callStatus,
        };
        updateData.$push = { callHistory: newNote };
        delete updateData.newCallNote; // Clean up the temporary field
    }

    // --- FIX: Handle new EXTERNAL call notes from Bank Executives ---
    if (updateData.externalCallNote && updateData.externalCallNote.notes) {
        const newNote = {
            // For bank executives, we don't have a persistent user ID, so we create a new one.
            // The important part is `loggedByName`.
            loggedById: new mongoose.Types.ObjectId(), 
            loggedByName: updateData.externalCallNote.loggedByName || 'Bank Executive',
            notes: updateData.externalCallNote.notes,
            callStatus: 'Log' // External notes are just logs
        };
        // Use $push to add to the externalCallHistory array
        updateData.$push = { ...updateData.$push, externalCallHistory: newNote };
        delete updateData.externalCallNote;
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
        
        // For now, we'll assume the user has access. Access control can be added here later.
        return res.status(200).json(updatedLead);

    } catch (error) {
        res.status(400).json({ message: 'Failed to update lead.', error: error.message });
    }
};

/**
 * 5. POST /api/leads/:id/assign-bank - Assign a lead to a bank and the correct regional RM
 * 5. POST /api/leads/:id/assign-bank - Assign a lead to a bank
 */
exports.assignToBank = async (req, res) => {
    const { id } = req.params;
    const { bankId, bankName } = req.body;

    if (!bankId || !bankName) {
        return res.status(400).json({ message: 'Bank ID and Bank Name are required.' });
    }

    try {
        const lead = await Lead.findById(id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        // Check if already assigned to this bank to prevent duplicates
        if (lead.assignedBanks.some(b => b.bankId.toString() === bankId)) {
            return res.status(409).json({ message: `Lead already assigned to ${bankName}.` });
        }

        // --- NEW: Find the correct RM based on the lead's region ---
        const bankDetails = await mongoose.model('Bank').findById(bankId);
        if (!bankDetails) {
            return res.status(404).json({ message: 'Bank details not found.' });
        }

        const leadRegion = lead.region;
        const assignedRM = bankDetails.relationshipManagers.find(rm => rm.region === leadRegion);

        if (!assignedRM) {
            return res.status(404).json({ message: `No Relationship Manager found for the ${leadRegion} region in ${bankName}.` });
        }

        lead.assignedBanks.push({ 
            bankId, 
            bankName,
            assignedRMName: assignedRM.name,
            assignedRMEmail: assignedRM.email
        });
        const updatedLead = await lead.save();
        res.status(200).json({ lead: updatedLead, message: `Lead assigned to ${assignedRM.name} at ${bankName}.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to assign lead to bank.', error: error.message });
    }
};