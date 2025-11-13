const JobPosting = require('../models/jobPostingModel');
const Candidate = require('../models/candidateModel');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'justtapnagendra@gmail.com',
        pass: process.env.EMAIL_PASS || 'lfxs gaqv ldyd rwnj'
    }
});

/**
 * Get all applications
 */
exports.getAllApplications = async (req, res) => {
    try {
        const candidates = await Candidate.find()
            .populate('applications.jobPosting', 'title department')
            .populate('applications.reviewedBy', 'fullName')
            .sort({ 'applications.appliedDate': -1 });

        // Flatten applications from candidates
        const applications = candidates.flatMap(candidate =>
            candidate.applications.map((app, index) => ({
                ...app.toObject(),
                candidateId: candidate._id,
                candidateName: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                experience: candidate.experience,
                skills: candidate.skills,
                coverLetter: app.coverLetter,
                resume: candidate.resume,
                applicationIndex: index
            }))
        );

        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Server error fetching applications.' });
    }
};

/**
 * Get application by candidate ID and application index
 */
exports.getApplicationById = async (req, res) => {
    const { candidateId, applicationIndex } = req.params;

    try {
        const candidate = await Candidate.findById(candidateId)
            .populate('applications.jobPosting', 'title department')
            .populate('applications.reviewedBy', 'fullName');
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        const application = candidate.applications[applicationIndex];
        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        res.status(200).json(application);
    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ message: 'Server error fetching application.' });
    }
};

/**
 * Create a new application
 */
exports.createApplication = async (req, res) => {
    const { jobPosting, candidateName, email, phone, dateOfBirth, education, branch, coverLetter, experience, skills } = req.body;

    // Validate required fields
    if (!candidateName || !email || !phone) {
        return res.status(400).json({ message: 'Name, email, and phone are required.' });
    }

    try {
        // Check if job posting exists and is active
        const job = await JobPosting.findById(jobPosting);
        if (!job || job.status !== 'Active') {
            return res.status(400).json({ message: 'Invalid or inactive job posting.' });
        }

        // Handle file upload
        let resumePath = null;
        if (req.file) {
            resumePath = req.file.filename;
        }

        // Create or update candidate record
        let candidate = await Candidate.findOne({ email });
        if (candidate) {
            // Update existing candidate - add new application to applications array
            candidate.applications.push({
                jobPosting,
                coverLetter,
                appliedDate: new Date(),
                status: 'Applied',
                score: 0
            });
            candidate.position = job.title; // Update position to latest application
            candidate.resume = resumePath || candidate.resume;
            candidate.skills = skills ? skills.split(',').map(s => s.trim()) : candidate.skills;
            candidate.experience = experience || candidate.experience;
            await candidate.save();
        } else {
            // Create new candidate
            candidate = await Candidate.create({
                name: candidateName,
                email,
                phone,
                dateOfBirth,
                education,
                branch,
                position: job.title,
                resume: resumePath,
                skills: skills ? skills.split(',').map(s => s.trim()) : [],
                experience,
                applications: [{
                    jobPosting,
                    coverLetter,
                    appliedDate: new Date(),
                    status: 'Applied',
                    score: 0
                }]
            });
        }

        // Add application to job posting's applicants array (store candidate ID)
        job.applicants.push(candidate._id);
        await job.save();

        res.status(201).json({ message: 'Application submitted successfully.', application: candidate.applications[candidate.applications.length - 1] });
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ message: 'Server error creating application.' });
    }
};

/**
 * Update application
 */
exports.updateApplication = async (req, res) => {
    const { candidateId, applicationIndex } = req.params;
    const { status, score, notes, reviewedBy } = req.body;

    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        const application = candidate.applications[applicationIndex];
        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        const oldStatus = application.status;
        application.status = status || application.status;
        application.score = score !== undefined ? score : application.score;
        application.notes = notes || application.notes;
        if (reviewedBy) {
            application.reviewedBy = reviewedBy;
            application.reviewDate = new Date();
        }

        await candidate.save();

        // Send email notification based on status change
        if (status && status !== oldStatus) {
            if (status === 'Completed') {
                await sendSelectionEmail(candidate, application);
            } else {
                await sendStatusUpdateEmail(candidate, application, status);
            }
        }

        res.status(200).json({ message: 'Application updated successfully.', application });
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ message: 'Server error updating application.' });
    }
};

/**
 * Delete application
 */
exports.deleteApplication = async (req, res) => {
    const { candidateId, applicationIndex } = req.params;

    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        if (applicationIndex < 0 || applicationIndex >= candidate.applications.length) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        const application = candidate.applications[applicationIndex];
        candidate.applications.splice(applicationIndex, 1);

        // If no applications left, remove candidate from job posting's applicants array
        if (candidate.applications.length === 0) {
            await JobPosting.findByIdAndUpdate(application.jobPosting, {
                $pull: { applicants: candidate._id }
            });
            // Optionally delete the candidate if no applications
            await Candidate.findByIdAndDelete(candidateId);
        } else {
            await candidate.save();
        }

        res.status(200).json({ message: 'Application deleted successfully.' });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ message: 'Server error deleting application.' });
    }
};

/**
 * Get applications by job posting
 */
exports.getApplicationsByJob = async (req, res) => {
    try {
        const applications = await Application.find({ jobPosting: req.params.jobId })
            .populate('reviewedBy', 'fullName')
            .sort({ appliedDate: -1 });
        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching applications by job:', error);
        res.status(500).json({ message: 'Server error fetching applications.' });
    }
};

/**
 * Send shortlist email to candidate
 */
exports.sendShortlistEmail = async (req, res) => {
    const { candidateId, applicationIndex, emailContent } = req.body;

    try {
        const candidate = await Candidate.findById(candidateId).populate('applications.jobPosting');
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        const application = candidate.applications[applicationIndex];
        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        const subject = `Congratulations! You have been shortlisted - ${application.jobPosting.title}`;
        const html = emailContent || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #1976d2; text-align: center;">Congratulations! You have been Shortlisted</h2>
                <p>Dear ${candidate.name},</p>
                <p>We are pleased to inform you that your application for the position of <strong>${application.jobPosting.title}</strong> has been shortlisted.</p>
                <p>Please wait for further updates and get ready for the hiring process. The hiring process includes the following steps:</p>
                <ol>
                    <li>Phone call interview</li>
                    <li>Aptitude test</li>
                    <li>Technical test</li>
                    <li>Technical interview</li>
                    <li>Manager round</li>
                    <li>HR round</li>
                    <li>Final round</li>
                </ol>
                <p>If you have any questions, please contact our HR team.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: candidate.email,
            subject,
            html
        });

        // Update application status to Shortlisted
        application.status = 'Shortlisted';
        await candidate.save();

        console.log(`✅ Shortlist email sent to ${candidate.email}`);
        res.status(200).json({ message: 'Shortlist email sent successfully.' });
    } catch (error) {
        console.error('Error sending shortlist email:', error);
        res.status(500).json({ message: 'Server error sending shortlist email.' });
    }
};

/**
 * Send reject email to candidate
 */
exports.sendRejectEmail = async (req, res) => {
    const { candidateId, applicationIndex, emailContent } = req.body;

    try {
        const candidate = await Candidate.findById(candidateId).populate('applications.jobPosting');
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }

        const application = candidate.applications[applicationIndex];
        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        const subject = `Application Update - ${application.jobPosting.title}`;
        const html = emailContent || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #1976d2; text-align: center;">Application Update</h2>
                <p>Dear ${candidate.name},</p>
                <p>Thank you for your interest in the position of <strong>${application.jobPosting.title}</strong>.</p>
                <p>We regret to inform you that we have decided to move forward with other candidates at this time.</p>
                <p>We appreciate your time and effort in applying for this position. We encourage you to apply for future opportunities that match your qualifications.</p>
                <p>If you have any questions, please contact our HR team.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: candidate.email,
            subject,
            html
        });

        // Update application status to Rejected
        application.status = 'Rejected';
        await candidate.save();

        console.log(`✅ Reject email sent to ${candidate.email}`);
        res.status(200).json({ message: 'Reject email sent successfully.' });
    } catch (error) {
        console.error('Error sending reject email:', error);
        res.status(500).json({ message: 'Server error sending reject email.' });
    }
};

/**
 * Send selection email to candidate when status is set to Completed
 */
const sendSelectionEmail = async (candidate, application) => {
    const subject = `Congratulations! You have been selected for the position - ${candidate.position}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1976d2; text-align: center;">Congratulations! You have been Selected</h2>
            <p>Dear ${candidate.name},</p>
            <p>Congratulations! You have been selected for the position of <strong>${candidate.position}</strong>.</p>
            <p>We will share further updates with you soon. Stay tuned!</p>
            <p>If you have any questions, please contact our HR team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: candidate.email,
            subject,
            html
        });
        console.log(`✅ Selection email sent to ${candidate.email}`);
    } catch (error) {
        console.error('Error sending selection email:', error);
    }
};

/**
 * Send status update email to candidate
 */
const sendStatusUpdateEmail = async (candidate, application, newStatus) => {
    const statusMessages = {
        'Shortlisted': 'Congratulations! Your application has been shortlisted.',
        'Interviewed': 'Your interview has been scheduled.',
        'Rejected': 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.',
        'Hired': 'Congratulations! We are pleased to offer you the position.'
    };

    const subject = `Application Status Update - ${candidate.position}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1976d2; text-align: center;">Application Status Update</h2>
            <p>Dear ${candidate.name},</p>
            <p>${statusMessages[newStatus] || 'Your application status has been updated.'}</p>
            <p>Position: ${candidate.position || 'N/A'}</p>
            <p>Status: ${newStatus}</p>
            <p>If you have any questions, please contact our HR team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: candidate.email,
            subject,
            html
        });
        console.log(`✅ Status update email sent to ${candidate.email}`);
    } catch (error) {
        console.error('Error sending status update email:', error);
    }
};
