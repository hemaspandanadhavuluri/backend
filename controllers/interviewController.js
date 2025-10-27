 const Interview = require('../models/interviewModel');
const Candidate = require('../models/candidateModel');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'justtapnagendra@gmail.com',
        pass: process.env.EMAIL_PASS || 'lfxs gaqv ldyd rwnj'
    }
});

/**
 * Get all interviews
 */
exports.getAllInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find()
            .populate('application', 'name email phone')
            .populate('scheduledBy', 'fullName')
            .populate('interviewerId', 'fullName')
            .sort({ date: 1, time: 1 });
        res.status(200).json(interviews);
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ message: 'Server error fetching interviews.' });
    }
};

/**
 * Get interview by ID
 */
exports.getInterviewById = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate('application', 'name email phone')
            .populate('scheduledBy', 'fullName')
            .populate('interviewerId', 'fullName');
        if (!interview) {
            return res.status(404).json({ message: 'Interview not found.' });
        }
        res.status(200).json(interview);
    } catch (error) {
        console.error('Error fetching interview:', error);
        res.status(500).json({ message: 'Server error fetching interview.' });
    }
};

/**
 * Create a new interview
 */
exports.createInterview = async (req, res) => {
    const { application, candidateName, position, date, time, interviewer, interviewerId, type, notes } = req.body;

    try {
        // Check if candidate exists
        const candidate = await Candidate.findById(application);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        const interview = await Interview.create({
            application,
            candidateName: candidateName || candidate.name,
            position: position || candidate.position,
            date,
            time,
            interviewer,
            interviewerId,
            type,
            notes,
            scheduledBy: req.user ? req.user._id : null,
            rating: 1 // Set default rating to 1 to avoid min validation error
        });

        // Update candidate's application status
        const appIndex = candidate.applications.findIndex(app => app._id.toString() === application.toString());
        if (appIndex !== -1) {
            candidate.applications[appIndex].status = 'Interviewed';
            await candidate.save();
        }

        // Send interview invitation email
        await sendInterviewEmail(interview, candidate);

        res.status(201).json({ message: 'Interview scheduled successfully.', interview });
    } catch (error) {
        console.error('Error creating interview:', error);
        res.status(500).json({ message: 'Server error creating interview.' });
    }
};

/**
 * Update interview
 */
exports.updateInterview = async (req, res) => {
    const { date, time, interviewer, interviewerId, type, status, rating, feedback, notes } = req.body;

    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ message: 'Interview not found.' });
        }

        interview.date = date || interview.date;
        interview.time = time || interview.time;
        interview.interviewer = interviewer || interview.interviewer;
        interview.interviewerId = interviewerId || interview.interviewerId;
        interview.type = type || interview.type;
        interview.status = status || interview.status;
        interview.rating = rating !== undefined ? rating : interview.rating;
        interview.feedback = feedback || interview.feedback;
        interview.notes = notes || interview.notes;

        if (status === 'Completed') {
            interview.completedAt = new Date();
        }

        await interview.save();

        // Send advanced stage email if phone interview is completed
        if (status === 'Completed' && interview.type === 'Phone Interview') {
            const candidate = await Candidate.findById(interview.application);
            await sendAdvancedStageEmail(interview, candidate);
        }

        res.status(200).json({ message: 'Interview updated successfully.', interview });
    } catch (error) {
        console.error('Error updating interview:', error);
        res.status(500).json({ message: 'Server error updating interview.' });
    }
};

/**
 * Delete interview
 */
exports.deleteInterview = async (req, res) => {
    try {
        const interview = await Interview.findByIdAndDelete(req.params.id);
        if (!interview) {
            return res.status(404).json({ message: 'Interview not found.' });
        }
        res.status(200).json({ message: 'Interview deleted successfully.' });
    } catch (error) {
        console.error('Error deleting interview:', error);
        res.status(500).json({ message: 'Server error deleting interview.' });
    }
};

/**
 * Get interviews by application
 */
exports.getInterviewsByApplication = async (req, res) => {
    try {
        const interviews = await Interview.find({ application: req.params.applicationId })
            .populate('scheduledBy', 'fullName')
            .populate('interviewerId', 'fullName')
            .sort({ date: 1 });
        res.status(200).json(interviews);
    } catch (error) {
        console.error('Error fetching interviews by application:', error);
        res.status(500).json({ message: 'Server error fetching interviews.' });
    }
};

/**
 * Send interview invitation email
 */
const sendInterviewEmail = async (interview, application) => {
    const subject = `Interview Invitation - ${interview.position}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1976d2; text-align: center;">Interview Invitation</h2>
            <p>Dear ${interview.candidateName},</p>
            <p>Congratulations! You have been selected for an interview for the position of <strong>${interview.position}</strong>.</p>
            <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Interview Details:</strong></p>
                <p>Date: ${new Date(interview.date).toLocaleDateString()}</p>
                <p>Time: ${interview.time}</p>
                <p>Type: ${interview.type}</p>
                <p>Interviewer: ${interview.interviewer}</p>
            </div>
            <p>Please prepare for the interview and be ready to discuss your experience and qualifications.</p>
            <p>If you have any questions, please contact our HR team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: application.email,
            subject,
            html
        });
        console.log(`✅ Interview invitation email sent to ${application.email}`);
    } catch (error) {
        console.error('Error sending interview email:', error);
    }
};

/**
 * Send advanced stage email after phone interview completion
 */
const sendAdvancedStageEmail = async (interview, application) => {
    const subject = `Advanced Stage in Interview Process - ${interview.position}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1976d2; text-align: center;">Congratulations! You have moved to the Advanced Stage</h2>
            <p>Dear ${interview.candidateName},</p>
            <p>Congratulations! You have successfully completed the Phone Interview for the position of <strong>${interview.position}</strong>.</p>
            
            <p>You have now moved to the advanced stage in the interview process. Our team will schedule the next round of interviews soon.</p>
            <p>Please stay tuned for further updates and get ready for the upcoming rounds.</p>
            <p>If you have any questions, please contact our HR team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: application.email,
            subject,
            html
        });
        console.log(`✅ Advanced stage email sent to ${application.email}`);
    } catch (error) {
        console.error('Error sending advanced stage email:', error);
    }
};
