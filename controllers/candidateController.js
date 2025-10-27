const Candidate = require('../models/candidateModel');
const Interview = require('../models/interviewModel');
const Offer = require('../models/offerModel');

/**
 * Get all candidates
 */
exports.getAllCandidates = async (req, res) => {
    try {
        const candidates = await Candidate.find()
            .populate('applications')
            .populate('interviews')
            .populate('offers')
            .sort({ appliedDate: -1 });
        res.status(200).json(candidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ message: 'Server error fetching candidates.' });
    }
};

/**
 * Get candidate by ID
 */
exports.getCandidateById = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate('applications')
            .populate('interviews')
            .populate('offers');
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }
        res.status(200).json(candidate);
    } catch (error) {
        console.error('Error fetching candidate:', error);
        res.status(500).json({ message: 'Server error fetching candidate.' });
    }
};

/**
 * Create a new candidate
 */
exports.createCandidate = async (req, res) => {
    const { name, email, phone, position, resume, skills, experience, notes } = req.body;

    try {
        // Check if candidate already exists
        const existingCandidate = await Candidate.findOne({ email });
        if (existingCandidate) {
            return res.status(409).json({ message: 'Candidate with this email already exists.' });
        }

        const candidate = await Candidate.create({
            name,
            email,
            phone,
            position,
            resume,
            skills: skills ? skills.split(',').map(s => s.trim()) : [],
            experience,
            notes
        });

        res.status(201).json({ message: 'Candidate created successfully.', candidate });
    } catch (error) {
        console.error('Error creating candidate:', error);
        res.status(500).json({ message: 'Server error creating candidate.' });
    }
};

/**
 * Update candidate
 */
exports.updateCandidate = async (req, res) => {
    const { name, email, phone, position, stage, score, resume, skills, experience, notes } = req.body;

    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        candidate.name = name || candidate.name;
        candidate.email = email || candidate.email;
        candidate.phone = phone || candidate.phone;
        candidate.position = position || candidate.position;
        candidate.stage = stage || candidate.stage;
        candidate.score = score !== undefined ? score : candidate.score;
        candidate.resume = resume || candidate.resume;
        candidate.skills = skills ? skills.split(',').map(s => s.trim()) : candidate.skills;
        candidate.experience = experience || candidate.experience;
        candidate.notes = notes || candidate.notes;

        await candidate.save();
        res.status(200).json({ message: 'Candidate updated successfully.', candidate });
    } catch (error) {
        console.error('Error updating candidate:', error);
        res.status(500).json({ message: 'Server error updating candidate.' });
    }
};

/**
 * Delete candidate
 */
exports.deleteCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findByIdAndDelete(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }
        res.status(200).json({ message: 'Candidate deleted successfully.' });
    } catch (error) {
        console.error('Error deleting candidate:', error);
        res.status(500).json({ message: 'Server error deleting candidate.' });
    }
};

/**
 * Get candidate by email
 */
exports.getCandidateByEmail = async (req, res) => {
    try {
        const candidate = await Candidate.findOne({ email: req.params.email })
            .populate('applications')
            .populate('interviews')
            .populate('offers');
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }
        res.status(200).json(candidate);
    } catch (error) {
        console.error('Error fetching candidate by email:', error);
        res.status(500).json({ message: 'Server error fetching candidate.' });
    }
};

/**
 * Add application to candidate
 */
exports.addApplicationToCandidate = async (req, res) => {
    const { candidateId, applicationId } = req.body;

    try {
        const candidate = await Candidate.findById(candidateId);
        // Assuming applicationId is the index or id within candidate's applications array
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        // Find the application in candidate's applications array
        const appIndex = candidate.applications.findIndex(app => app._id.toString() === applicationId.toString());
        if (appIndex === -1) {
            return res.status(404).json({ message: 'Application not found in candidate.' });
        }

        // Application already exists, no need to add
        res.status(200).json({ message: 'Application already associated with candidate.', candidate });
    } catch (error) {
        console.error('Error adding application to candidate:', error);
        res.status(500).json({ message: 'Server error updating candidate.' });
    }
};

/**
 * Add interview to candidate
 */
exports.addInterviewToCandidate = async (req, res) => {
    const { candidateId, interviewId } = req.body;

    try {
        const candidate = await Candidate.findById(candidateId);
        const interview = await Interview.findById(interviewId);

        if (!candidate || !interview) {
            return res.status(404).json({ message: 'Candidate or interview not found.' });
        }

        if (!candidate.interviews.includes(interviewId)) {
            candidate.interviews.push(interviewId);
            await candidate.save();
        }

        res.status(200).json({ message: 'Interview added to candidate successfully.', candidate });
    } catch (error) {
        console.error('Error adding interview to candidate:', error);
        res.status(500).json({ message: 'Server error updating candidate.' });
    }
};

/**
 * Add offer to candidate
 */
exports.addOfferToCandidate = async (req, res) => {
    const { candidateId, offerId } = req.body;

    try {
        const candidate = await Candidate.findById(candidateId);
        const offer = await Offer.findById(offerId);

        if (!candidate || !offer) {
            return res.status(404).json({ message: 'Candidate or offer not found.' });
        }

        if (!candidate.offers.includes(offerId)) {
            candidate.offers.push(offerId);
            await candidate.save();
        }

        res.status(200).json({ message: 'Offer added to candidate successfully.', candidate });
    } catch (error) {
        console.error('Error adding offer to candidate:', error);
        res.status(500).json({ message: 'Server error updating candidate.' });
    }
};
