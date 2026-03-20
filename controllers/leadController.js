// src/controllers/leadController.js
const Lead = require('../models/leadModel');
const emailService = require('../services/emailService'); // Corrected path
const mongoose = require('mongoose');
const User = require('../models/userModel');

const otpStore = {}; // In-memory store for OTPs. In production, use Redis or a database.
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
    const { userId, role, region, zone, bank, assigned, searchTerm } = req.query;

    // The user object is now constructed directly from the frontend request query.
    // No more mock data fallback.
    const user = { id: userId, role, region, zone, bank };

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
    } else if (user.role === 'Assigner' && assigned === 'false') {
        // Special filter for the Assigner Panel to get unassigned leads
        filter = { assignedFOId: { $exists: false } };
    } else if (user.role.toLowerCase() === 'assigner') { // A general case for assigner if needed
        // Special filter for the Assigner Panel to get unassigned leads
        filter = { assignedFOId: { $exists: false } };
    } else {
        return res.status(403).json({ message: 'Access Denied: Role not authorized to view leads.' });
    }

    // --- NEW: Add search term logic ---
    if (searchTerm) {
        const searchRegex = { $regex: searchTerm, $options: 'i' }; // Case-insensitive regex
        const searchFilter = {
            $or: [
                { leadID: searchRegex }, // Ensure leadID is searchable
                { fullName: searchRegex },
                { email: searchRegex },
                { mobileNumbers: searchRegex },
                { 'source.source': searchRegex },
                { 'source.name': searchRegex },
                { 'assignedBanks.bankName': searchRegex },
                { 'assignedBanks.assignedRMName': searchRegex },
                { 'callHistory.loggedByName': searchRegex },
                { 'callHistory.notes': searchRegex },
                { 'externalCallHistory.loggedByName': searchRegex },
                { 'externalCallHistory.notes': searchRegex }
            ]
        };
        filter = { ...filter, ...searchFilter }; // Combine role filter with search filter
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
    const { fullName, mobileNumbers, source, zone, region, assignedFOId, assignedFO, assignedFOPhone } = req.body;

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
    // Determine if id is _id or leadID
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { leadID: id };
    const lead = await Lead.findOne(query);

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
    console.log("updateData ", updateData);

    // Determine if id is _id or leadID
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { leadID: id };

    // --- FIX: Separate atomic operators from direct updates ---
    const atomicOps = {};

    // --- FIX: Preserve the 'source' field if it's not in the update payload ---
    // The `source` field is required by the schema, but may not be sent on every
    // update from the form. This ensures we don't wipe it out.
    if (!updateData.source || !updateData.source.source) {
        try {
            const existingLead = await Lead.findOne(query).select('source').lean();
            if (existingLead && existingLead.source) {
                updateData.source = existingLead.source;
            }
        } catch (e) { /* If find fails, let the update proceed and likely fail validation, which is ok */ }
    }

    // --- NEW: Handle sanctionedDate when bankLeadStatus or bankApplicationStatus changes to Sanctioned ---
    if (updateData.assignedBanks && Array.isArray(updateData.assignedBanks)) {
        const existingLead = await Lead.findOne(query).select('assignedBanks').lean();
        if (existingLead) {
            updateData.assignedBanks.forEach((bank, index) => {
                const existingBank = existingLead.assignedBanks[index];
                // Check if status is changing to Sanctioned (either bankLeadStatus or bankApplicationStatus)
                const isNowSanctioned = bank.bankLeadStatus === 'Sanctioned' || bank.bankApplicationStatus === 'Sanctioned';
                const wasNotSanctioned = existingBank?.bankLeadStatus !== 'Sanctioned' && existingBank?.bankApplicationStatus !== 'Sanctioned';
                
                if (isNowSanctioned && wasNotSanctioned && !bank.sanctionedDate) {
                    bank.sanctionedDate = new Date();
                }
            });
        }
    }

    // --- FIX: Handle new call notes ---
    // If a new note is part of the payload (sent as `newNote` from frontend), add it to the call history array.
    if (updateData.newNote && updateData.newNote.notes) {
        // NOTE: The loggedById and loggedByName should come from `req.user`
        // which is populated by an authentication middleware (e.g., JWT).
        const newNote = {
            loggedById: new mongoose.Types.ObjectId(updateData.newNote.loggedById),
            loggedByName: updateData.newNote.loggedByName,
            notes: updateData.newNote.notes,
            callStatus: updateData.newNote.callStatus || 'Log',
        };
        if (!newNote.loggedById || !newNote.loggedByName) {
            return res.status(400).json({ message: 'Could not log note. User information is missing from the request.' });
        }
        atomicOps.$push = { callHistory: newNote };
        updateData.lastCallDate = new Date(); // Also update lastCallDate to now
        delete updateData.newNote; // Clean up the temporary field
        // *** CRITICAL FIX: Prevent conflict by deleting the field from the main update object ***
        delete updateData.callHistory;
    }

    // --- FIX: Handle new EXTERNAL call notes from Bank Executives ---
    if (updateData.externalCallNote && updateData.externalCallNote.notes) {
        const newNote = {
            // For bank executives, we don't have a persistent user ID, so we create a new one.
            // The important part is `loggedByName`.
            loggedById: new mongoose.Types.ObjectId(),
            loggedByName: updateData.externalCallNote.loggedByName || 'Bank Executive',
            notes: updateData.externalCallNote.notes,
            callStatus: updateData.externalCallNote.callStatus || 'Log' // Allow status override
        };
        // Use $push to add to the externalCallHistory array
        if (!atomicOps.$push) atomicOps.$push = {};
        atomicOps.$push.externalCallHistory = newNote;
        delete updateData.externalCallNote;
        delete updateData.externalCallHistory;
    }

    // Perform the main lead update
    try {
        const updatedLead = await Lead.findOneAndUpdate(
            query,
            { ...atomicOps, $set: updateData },
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
    const { bankId, bankName, assignedRMName, assignedRMEmail, state, assignedByName, assignedById } = req.body;

    if (!bankId || !bankName || !assignedRMName || !assignedRMEmail || !state) {
        return res.status(400).json({ message: 'Bank ID, Bank Name, RM details, and State are required.' });
    }

    try {
        // Determine if id is _id or leadID
        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { leadID: id };
        const lead = await Lead.findOne(query);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        if (lead.assignedBanks.some(b => b.bankId.toString() === bankId)) {
            return res.status(409).json({ message: `Lead already assigned to ${bankName}.` });
        }

        lead.assignedBanks.push({
            bankId,
            bankName,
            assignedRMName: assignedRMName,
            assignedRMEmail: assignedRMEmail,
            state: state,
            bankLeadStatus: 'In Progress',
            contactible: true,
            bankApplicationStatus: '',
            bankSubStatus: '',
            bankAppId: '',
            bankLastCallDate: null,
            bankNextCallDate: null,
            bankReminders: [],
            crmId: ''
        });

        // Add note to FO's callHistory
        const foNote = {
            loggedById: assignedById ? new mongoose.Types.ObjectId(assignedById) : new mongoose.Types.ObjectId(),
            loggedByName: assignedByName || 'FO',
            notes: `Lead assigned to ${bankName} - RM: ${assignedRMName} (${assignedRMEmail})`,
            callStatus: 'Log',
            createdAt: new Date()
        };
        lead.callHistory.push(foNote);

        // Add note to bank's externalCallHistory
        const bankNote = {
            loggedById: assignedById ? new mongoose.Types.ObjectId(assignedById) : new mongoose.Types.ObjectId(),
            loggedByName: assignedByName || 'FO',
            notes: `Lead assigned to ${bankName} - RM: ${assignedRMName}`,
            callStatus: 'Log',
            createdAt: new Date(),
            targetBank: bankName
        };
        lead.externalCallHistory.push(bankNote);

        const updatedLead = await lead.save();
        res.status(200).json({ lead: updatedLead, message: `Lead assigned to ${assignedRMName} at ${bankName}.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to assign lead to bank.', error: error.message });
    }
};

/**
 * 6. POST /api/leads/:id/upload-document - Upload a document for a lead
 */
exports.uploadDocument = async (req, res) => {
    const { id } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    if (!documentType) {
        return res.status(400).json({ message: 'Document type is required.' });
    }

    try {
        // Determine if id is _id or leadID
        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { leadID: id };
        const lead = await Lead.findOne(query);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        const newDocument = {
            documentType,
            fileName: req.file.originalname,
            filePath: `/uploads/${req.file.filename}` // Path to access the file via the static route
        };

        // Remove existing doc of the same type before adding new one
        lead.documents = lead.documents.filter(doc => doc.documentType !== documentType);
        lead.documents.push(newDocument);

        const updatedLead = await lead.save();
        res.status(200).json(updatedLead);

    } catch (error) {
        res.status(500).json({ message: 'Failed to upload document.', error: error.message });
    }
};

/**
 * 7. POST /api/leads/:id/send-document-link - Send document upload link to student
 */
exports.sendDocumentLink = async (req, res) => {
    const { id } = req.params;

    try {
        // Determine if id is _id or leadID
        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { leadID: id };
        const lead = await Lead.findOne(query);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        if (!lead.email) {
            return res.status(400).json({ message: 'Lead does not have an email address.' });
        }

        await emailService.sendDocumentUploadEmail(lead.email, lead.fullName, lead._id);

        res.status(200).json({ message: `Document upload link sent to ${lead.email}.` });

    } catch (error) {
        console.error('Failed to send document link email please check:', error);
        res.status(500).json({ message: 'Failed to send email.', error: error.message });
    }
};

/**
 * 9. POST /api/leads/:id/send-document-otp - Send OTP for document access
 */
exports.sendDocumentAccessOtp = async (req, res) => {
    const { id } = req.params;
    console.log('=== OTP REQUEST RECEIVED ===');
    console.log('Lead ID:', id);
    try {
        const lead = await Lead.findById(id).select('email');
        if (!lead || !lead.email) {
            console.log('Lead not found or no email');
            return res.status(404).json({ message: 'Lead not found or has no email.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 10 * 60 * 1000;
        otpStore[id] = { otp, expiry };

        console.log(`\n========================================`);
        console.log(`OTP for Lead ID: ${id}`);
        console.log(`Email: ${lead.email}`);
        console.log(`OTP: ${otp}`);
        console.log(`Valid until: ${new Date(expiry).toLocaleString()}`);
        console.log(`========================================\n`);

        await emailService.sendGenericEmail(
            lead.email,
            'Your One-Time Password for Document Access',
            `<p>Your OTP for accessing lead documents is: <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
        );

        res.status(200).json({ message: 'OTP sent successfully.', otp });
    } catch (error) {
        console.error('Error sending document access OTP please check:', error);
        res.status(500).json({ message: 'Failed to send OTP.' });
    }
};

/**
 * 10. POST /api/leads/:id/verify-document-otp - Verify OTP for document access
 */
exports.verifyDocumentAccessOtp = async (req, res) => {
    const { id } = req.params;
    const { otp } = req.body;

    const storedOtpData = otpStore[id];

    if (!storedOtpData) {
        return res.status(400).json({ message: 'No OTP was requested for this lead or it has expired.' });
    }

    if (Date.now() > storedOtpData.expiry) {
        delete otpStore[id];
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (storedOtpData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP is correct. Clear it and send success response.
    delete otpStore[id];
    res.status(200).json({ success: true, message: 'OTP verified successfully.' });
};

/**
 * 8. POST /api/leads/:id/send-email - Send a generic template email to the student
 */
exports.sendTemplateEmail = async (req, res) => {
    const { id } = req.params;
    const { subject, body } = req.body;

    if (!subject || !body) {
        return res.status(400).json({ message: 'Email subject and body are required.' });
    }

    try {
        // Determine if id is _id or leadID
        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { leadID: id };
        const lead = await Lead.findOne(query).select('email fullName');
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }
        if (!lead.email) {
            return res.status(400).json({ message: 'Lead does not have an email address.' });
        }

        await emailService.sendGenericEmail(lead.email, subject, body);
        res.status(200).json({ message: `Email sent successfully to ${lead.email}.` });
    } catch (error) {
        console.error('Failed to send template email:', error);
        res.status(500).json({ message: 'Failed to send email.', error: error.message });
    }
};

/**
 * 9. GET /api/leads/stats/:counsellorId - Get stats for a counsellor
 */
exports.getCounsellorStats = async (req, res) => {
    const { counsellorId } = req.params;

    try {
        // Build query filter - handles both string and ObjectId formats
        const baseFilter = {
            $or: [
                { counsellorId: counsellorId },
                { counsellorId: new mongoose.Types.ObjectId(counsellorId) }
            ]
        };
        
        const totalLeads = await Lead.countDocuments(baseFilter);
        const inProgress = await Lead.countDocuments({ ...baseFilter, leadStatus: 'In Progress' });
        const sanctioned = await Lead.countDocuments({ ...baseFilter, leadStatus: 'Sanctioned' });
        const rejected = await Lead.countDocuments({ ...baseFilter, leadStatus: 'Close' });

        res.status(200).json({ totalLeads, inProgress, sanctioned, rejected });
    } catch (error) {
        console.error('Error fetching counsellor stats:', error);
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

/**
 * 10. GET /api/leads/recent/:counsellorId - Get recent submissions for a counsellor
 */
exports.getRecentSubmissionsForCounsellor = async (req, res) => {
    const { counsellorId } = req.params;

    try {
        // Build query filter - handles both string and ObjectId formats
        const filter = {
            $or: [
                { counsellorId: counsellorId },
                { counsellorId: new mongoose.Types.ObjectId(counsellorId) }
            ]
        };
        
        const recentLeads = await Lead.find(filter)
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullName loanAmountRequired interestedCountries leadStatus createdAt');

        res.status(200).json(recentLeads);
    } catch (error) {
        console.error('Error fetching recent submissions:', error);
        res.status(500).json({ message: 'Error fetching recent submissions', error });
    }
};

/**
 * 11. GET /api/leads/counsellor/:counsellorId - Get all leads for a counsellor with computed status
 * Status Logic:
 * - If leadStatus is 'Close', display as 'closed'
 * - If leadStatus is 'Sanctioned', display as 'sanctioned'
 * - If callHistory has recent activity (last 24 hours), display as 'in-progress'
 * - Otherwise, display as 'under-review'
 */
exports.getCounsellorLeads = async (req, res) => {
    const { counsellorId } = req.params;

    try {
        // Build query filter - handles both string and ObjectId formats
        const filter = {
            $or: [
                { counsellorId: counsellorId },
                { counsellorId: new mongoose.Types.ObjectId(counsellorId) }
            ]
        };

        const leads = await Lead.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Compute status for each lead based on business logic
        const leadsWithComputedStatus = leads.map(lead => {
            let displayStatus = 'under-review'; // default

            // Rule 1: If closed in FO panel
            if (lead.leadStatus === 'Close') {
                displayStatus = 'closed';
            }
            // Rule 2: If sanctioned
            else if (lead.leadStatus === 'Sanctioned') {
                displayStatus = 'sanctioned';
            }
            // Rule 3: If there's recent activity in call history (last 24 hours)
            else if (lead.callHistory && lead.callHistory.length > 0) {
                const lastCallTime = new Date(lead.callHistory[lead.callHistory.length - 1].createdAt);
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                if (lastCallTime > twentyFourHoursAgo) {
                    displayStatus = 'in-progress';
                } else {
                    // Old activity, show as under-review
                    displayStatus = 'under-review';
                }
            }

            // Calculate progress percentage
            let progress = 10; // Default for new leads
            if (displayStatus === 'closed') progress = 20;
            else if (displayStatus === 'under-review') progress = 45;
            else if (displayStatus === 'in-progress') progress = 70;
            else if (displayStatus === 'sanctioned') progress = 100;

            return {
                _id: lead._id,
                id: lead.leadID,
                name: lead.fullName,
                amount: lead.loanAmountRequired ? `₹${lead.loanAmountRequired.toLocaleString('en-IN')}` : '₹0',
                country: lead.interestedCountries && lead.interestedCountries.length > 0 ? lead.interestedCountries[0] : 'N/A',
                status: displayStatus,
                submittedDate: new Date(lead.createdAt).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                lastUpdated: new Date(lead.updatedAt).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                progress: progress,
                phone: lead.mobileNumbers && lead.mobileNumbers.length > 0 ? lead.mobileNumbers[0] : 'N/A',
                email: lead.email || 'N/A',
                city: lead.permanentLocation || 'N/A',
                citizenship: 'Indian', // Can be extended based on actual data
                lender: lead.approachedBanks && lead.approachedBanks.length > 0 ? lead.approachedBanks[0].bankName : 'N/A',
                university: lead.admittedUniversities && lead.admittedUniversities.length > 0 ? lead.admittedUniversities[0] : 'N/A',
                course: lead.degree || 'N/A',
                intake: lead.courseStartMonth && lead.courseStartYear ? `${lead.courseStartMonth} ${lead.courseStartYear}` : 'N/A'
            };
        });

        res.status(200).json(leadsWithComputedStatus);
    } catch (error) {
        console.error('Error fetching counsellor leads:', error);
        res.status(500).json({ message: 'Error fetching counsellor leads', error });
    }
};

/**
 * 12. GET /api/leads/messages/:counsellorId - Get all messages/notes for a counsellor's leads
 */
exports.getCounsellorMessages = async (req, res) => {
    const { counsellorId } = req.params;

    try {
        // Build query filter - handles both string and ObjectId formats
        const filter = {
            $or: [
                { counsellorId: counsellorId },
                { counsellorId: new mongoose.Types.ObjectId(counsellorId) }
            ]
        };

        // Fetch leads with callHistory and externalCallHistory
        const leads = await Lead.find(filter)
            .select('leadID fullName callHistory externalCallHistory counsellorName')
            .sort({ updatedAt: -1 })
            .lean();

        // Collect all messages from all leads
        const allMessages = [];
        const recentLeads = [];

        leads.forEach(lead => {
            // Add to recent leads list
            recentLeads.push({
                id: lead.leadID,
                name: lead.fullName,
                initial: lead.fullName.split(' ').map(n => n[0]).join('').toUpperCase(),
                active: false // Will be set based on selected lead
            });

            // Process internal call history
            if (lead.callHistory && lead.callHistory.length > 0) {
                lead.callHistory.forEach(note => {
                    allMessages.push({
                        id: note._id,
                        leadId: lead.leadID,
                        leadName: lead.fullName,
                        sender: note.loggedByName,
                        message: note.notes,
                        timestamp: note.createdAt,
                        type: 'internal', // counsellor or FO notes
                        callStatus: note.callStatus
                    });
                });
            }

            // Process external call history (from bank executives)
            if (lead.externalCallHistory && lead.externalCallHistory.length > 0) {
                lead.externalCallHistory.forEach(note => {
                    allMessages.push({
                        id: note._id,
                        leadId: lead.leadID,
                        leadName: lead.fullName,
                        sender: note.loggedByName,
                        message: note.notes,
                        timestamp: note.createdAt,
                        type: 'external', // bank executive notes
                        callStatus: note.callStatus
                    });
                });
            }
        });

        // Sort messages by timestamp (newest first)
        allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Group messages by date for timeline display
        const groupedMessages = {};
        allMessages.forEach(msg => {
            const date = new Date(msg.timestamp).toDateString();
            if (!groupedMessages[date]) {
                groupedMessages[date] = [];
            }
            groupedMessages[date].push(msg);
        });

        res.status(200).json({
            recentLeads: recentLeads.slice(0, 5), // Limit to 5 recent leads
            messages: groupedMessages,
            counsellorName: leads.length > 0 ? leads[0].counsellorName : 'Counsellor'
        });
    } catch (error) {
        console.error('Error fetching counsellor messages:', error);
        res.status(500).json({ message: 'Error fetching counsellor messages', error });
    }
};

/**
 * 13. POST /api/leads/:id/wrong-update - Report a wrong update from a bank
 */
exports.reportWrongUpdate = async (req, res) => {
    const { id } = req.params;
    const { bankId, issueType, subType, notes, fromName, fromRole, createdById, createdByName } = req.body;

    // Use provided names/roles or fallback
    const reporterName = fromName || 'Finance Officer';
    const reporterRole = fromRole || 'FO';

    if (!bankId || !issueType || !subType) {
        return res.status(400).json({ message: 'Bank ID, Issue Type, and Sub Type are required.' });
    }

    try {
        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { leadID: id };
        const lead = await Lead.findOne(query);

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        // Find the specific bank assignment
        const bankAssignment = lead.assignedBanks.find(b => b.bankId.toString() === bankId);

        if (!bankAssignment) {
            return res.status(404).json({ message: 'Bank assignment not found for this lead.' });
        }

        // CRITICAL FIX: Validate targetBank matches bankAssignment.bankName
        const bankName = bankAssignment.bankName;
        if (!bankName) {
            return res.status(400).json({ message: 'Bank name is missing from bank assignment. Cannot create task.' });
        }

        // 1. Add to Notifications
        const notification = {
            type: 'Wrong Update',
            subType: `${issueType} - ${subType}`,
            message: notes || 'No additional notes.',
            fromRole: fromRole,
            fromName: fromName,
            createdAt: new Date()
        };
        bankAssignment.notifications.push(notification);

        // 2. Add to External Call History (so it shows in Bank Panel Notes)
        // CRITICAL FIX: Add targetBank field for proper bank-level isolation
        const historyNote = {
            loggedById: new mongoose.Types.ObjectId(), // Generate a new ID if we don't have the FO's ID handy
            loggedByName: `${reporterName} (${reporterRole})`,
            notes: `[Wrong Update Reported] Type: ${issueType}, Sub-Type: ${subType}. Note: ${notes}`,
            callStatus: 'Log',
            createdAt: new Date(),
            targetBank: bankName // CRITICAL: Add targetBank for proper filtering
        };
        lead.externalCallHistory.push(historyNote);

        // 2.5. ALSO add to FO's callHistory so it appears in FO panel
        const foHistoryNote = {
            loggedById: createdById ? new mongoose.Types.ObjectId(createdById) : new mongoose.Types.ObjectId(),
            loggedByName: `${reporterName} (${reporterRole})`,
            notes: `[Wrong Update Reported to ${bankName}] Type: ${issueType}, Sub-Type: ${subType}. Note: ${notes}`,
            callStatus: 'Log',
            createdAt: new Date()
        };
        lead.callHistory.push(foHistoryNote);

        // 3. create task for bank executives as well
        // CRITICAL FIX: Ensure targetBank is always set and matches bankAssignment.bankName
        const bankExecs = await User.find({ role: 'BankExecutive', bank: bankName });
        const Task = require('../models/taskModel');
        if (bankExecs && bankExecs.length > 0) {
            for (const exec of bankExecs) {
                try {
                    await Task.create({
                        leadId: lead._id,
                        subject: `Wrong Update: ${issueType} - ${subType}`,
                        body: notes || '',
                        assignedToId: exec._id,
                        assignedToName: exec.fullName,
                        createdById: createdById || null,
                        createdByName: createdByName || reporterName,
                        creatorRole: reporterRole,
                        targetBank: bankName // CRITICAL: Must match bankAssignment.bankName exactly
                    });
                } catch (e) {
                    console.error('Failed to create wrong-update task for bank executive', exec._id, e);
                }
            }
        } else {
            console.warn(`No BankExecutive users found for bank "${bankName}"; creating fallback wrong-update task for reporter.`);
            try {
                await Task.create({
                    leadId: lead._id,
                    subject: `Wrong Update: ${issueType} - ${subType}`,
                    body: notes || '',
                    assignedToId: createdById || null,
                    assignedToName: createdByName || reporterName,
                    createdById: createdById || null,
                    createdByName: createdByName || reporterName,
                    creatorRole: reporterRole,
                    targetBank: bankName // CRITICAL: Must match bankAssignment.bankName exactly
                });
            } catch (e) {
                console.error('Failed to create fallback wrong-update task for reporter', e);
            }
        }

        await lead.save();

        res.status(200).json({ message: 'Wrong update reported and notification sent to bank.', lead });

    } catch (error) {
        console.error('Error reporting wrong update:', error);
        res.status(500).json({ message: 'Failed to report wrong update.', error: error.message });
    }
};

/**
 * 14. PUT /api/leads/:id/notifications/:notificationId/read - Mark notification as read
 */
exports.markNotificationAsRead = async (req, res) => {
    const { id, notificationId } = req.params;
    const { bankName } = req.body; // We need to know which bank's notification to mark

    try {
        const lead = await Lead.findById(id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        const bank = lead.assignedBanks.find(b => b.bankName === bankName);
        const notification = bank?.notifications.id(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        notification.isRead = true;
        await lead.save();

        // also mark any related tasks (created by FO) as done so they disappear from "assigned by me"
        try {
            const Task = require('../models/taskModel');
            const subj = `${notification.type}: ${notification.subType}`;
            await Task.updateMany(
                { leadId: lead._id, subject: subj, status: 'Open' },
                { status: 'Done' }
            );
        } catch (tErr) {
            console.error('Error updating tasks when notification read:', tErr);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to mark notification as read.', error: error.message });
    }
};

/**
 * 15. POST /api/leads/:id/notify-bank - Send Contact ASAP or Negotiate notification to bank
 */
exports.notifyBank = async (req, res) => {
    const { id } = req.params;
    const { bankId, type, subType, notes, fromName, fromRole, createdById, createdByName } = req.body;
    // Use provided names/roles or fallback
    const reporterName = fromName || 'Finance Officer';
    const reporterRole = fromRole || 'FO';

    if (!bankId || !type || !subType) {
        return res.status(400).json({ message: 'Bank ID, Type, and Sub Type are required.' });
    }

    try {
        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { leadID: id };
        const lead = await Lead.findOne(query);

        if (!lead) return res.status(404).json({ message: 'Lead not found.' });

        const bankAssignment = lead.assignedBanks.find(b => b.bankId.toString() === bankId);
        if (!bankAssignment) return res.status(404).json({ message: 'Bank assignment not found.' });

        // CRITICAL FIX: Validate targetBank matches bankAssignment.bankName
        const bankName = bankAssignment.bankName;
        if (!bankName) {
            return res.status(400).json({ message: 'Bank name is missing from bank assignment. Cannot create task.' });
        }

        // Ensure externalCallHistory exists
        if (!lead.externalCallHistory) {
            lead.externalCallHistory = [];
        }

        // 1. Add Notification
        const notification = {
            type, // 'Contact ASAP' or 'Negotiate'
            subType,
            message: notes || '',
            fromRole: reporterRole,
            fromName: reporterName,
            createdAt: new Date(),
            isRead: false
        };
        bankAssignment.notifications.push(notification);

        // 2. Add to External Call History (so it appears in Bank Panel notes & FO history)
        // CRITICAL FIX: Add targetBank field for proper bank-level isolation
        const historyNote = {
            loggedById: new mongoose.Types.ObjectId(), // Placeholder ID
            loggedByName: `${reporterName} (${reporterRole})`,
            notes: `[Notification] ${type}: ${subType}. ${notes ? `Note: ${notes}` : ''}`,
            callStatus: 'Log',
            createdAt: new Date(),
            targetBank: bankName // CRITICAL: Add targetBank for proper filtering
        };
        lead.externalCallHistory.push(historyNote);

        // 2.5. ALSO add to FO's callHistory so it appears in FO panel
        const foHistoryNote = {
            loggedById: createdById ? new mongoose.Types.ObjectId(createdById) : new mongoose.Types.ObjectId(),
            loggedByName: `${reporterName} (${reporterRole})`,
            notes: `[${type} to ${bankName}] ${subType}. ${notes ? `Note: ${notes}` : ''}`,
            callStatus: 'Log',
            createdAt: new Date()
        };
        lead.callHistory.push(foHistoryNote);

        // 3. Create corresponding task(s) for the bank executive(s)
        // CRITICAL FIX: Ensure targetBank is always set and matches bankAssignment.bankName
        const bankExecs = await User.find({ role: 'BankExecutive', bank: bankName });
        const Task = require('../models/taskModel');
        if (bankExecs && bankExecs.length > 0) {
            for (const exec of bankExecs) {
                const taskPayload = {
                    leadId: lead._id,
                    subject: `${type}: ${subType}`,
                    body: notes || '',
                    assignedToId: exec._id,
                    assignedToName: exec.fullName,
                    createdById: createdById || null,
                    createdByName: createdByName || reporterName,
                    creatorRole: reporterRole,
                    targetBank: bankName // CRITICAL: Must match bankAssignment.bankName exactly
                };
                try {
                    await Task.create(taskPayload);
                } catch (e) {
                    console.error('Failed to create task for bank executive', exec._id, e);
                }
            }
        } else {
            console.warn(`No BankExecutive users found for bank "${bankName}"; creating fallback task for reporter.`);
            try {
                await Task.create({
                    leadId: lead._id,
                    subject: `${type}: ${subType}`,
                    body: notes || '',
                    assignedToId: createdById || null,
                    assignedToName: createdByName || reporterName,
                    createdById: createdById || null,
                    createdByName: createdByName || reporterName,
                    creatorRole: reporterRole,
                    targetBank: bankName // CRITICAL: Must match bankAssignment.bankName exactly
                });
            } catch (e) {
                console.error('Failed to create fallback task for reporter', e);
            }
        }

        await lead.save();
        res.status(200).json({ message: 'Notification sent to bank.', lead });
    } catch (error) {
        console.error('Error notifying bank:', error);
        res.status(500).json({ message: 'Failed to notify bank.', error: error.message });
    }
};
