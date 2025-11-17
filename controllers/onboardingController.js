const Onboarding = require('../models/onboardingModel');
const User = require('../models/userModel');
const Candidate = require('../models/candidateModel');
const Offer = require('../models/offerModel');
const transporter = require('../config/mailer');

// Submit onboarding form
exports.submitOnboarding = async (req, res) => {
    try {
        const formData = req.body;
        const files = req.files;

        // Handle file uploads
        if (req.files && req.files.profileUpload) formData.profilePictureUrl = '/uploads/' + req.files.profileUpload[0].filename;
        if (req.files && req.files.aadharUpload) formData.aadharUpload = '/uploads/' + req.files.aadharUpload[0].filename;
        if (req.files && req.files.panUpload) formData.panUpload = '/uploads/' + req.files.panUpload[0].filename;
        if (req.files && req.files.bankStatementUpload) formData.bankStatementUpload = '/uploads/' + req.files.bankStatementUpload[0].filename;

        // Find candidate by email or create new
        let candidate = await Candidate.findOne({ email: formData.email });
        if (!candidate) {
            candidate = new Candidate({
                fullName: formData.name,
                email: formData.email,
                phone: formData.personalNumber,
                dateOfBirth: formData.dateOfBirth
            });
            await candidate.save();
        }

        formData.candidateId = candidate._id;

        const onboarding = new Onboarding(formData);
        await onboarding.save();

        // Send confirmation email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: formData.email,
            subject: 'Onboarding Form Submitted',
            html: '<p>We are processing your details. You will be notified once approved.</p>'
        });

        res.status(201).json({ message: 'Onboarding form submitted successfully', onboarding });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting onboarding form', error: error.message });
    }
};

// Get pending onboardings
exports.getPendingOnboardings = async (req, res) => {
    try {
        const onboardings = await Onboarding.find({ status: 'pending' }).populate('candidateId');
        res.json(onboardings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching onboardings', error: error.message });
    }
};

// Get approved onboardings
exports.getApprovedOnboardings = async (req, res) => {
    try {
        const onboardings = await Onboarding.find({ status: { $in: ['approved', 'onboard'] }, finalOnboarded: false }).populate('candidateId');
        res.json(onboardings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching approved onboardings', error: error.message });
    }
};

// Get onboarded onboardings
exports.getOnboardedOnboardings = async (req, res) => {
    try {
        const onboardings = await Onboarding.find({ status: 'onboarded' }).populate('candidateId');
        res.json(onboardings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching onboarded onboardings', error: error.message });
    }
};

// Get onboarding by ID
exports.getOnboardingById = async (req, res) => {
    try {
        const onboarding = await Onboarding.findById(req.params.id).populate('candidateId');
        if (!onboarding) return res.status(404).json({ message: 'Onboarding not found' });
        res.json(onboarding);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching onboarding', error: error.message });
    }
};

// Approve onboarding
exports.approveOnboarding = async (req, res) => {
    try {
        const onboarding = await Onboarding.findByIdAndUpdate(
            req.params.id,
            { status: 'approved', approvedAt: new Date() },
            { new: true }
        );
        res.json({ message: 'Onboarding approved', onboarding });
    } catch (error) {
        res.status(500).json({ message: 'Error approving onboarding', error: error.message });
    }
};

// Raise issue with onboarding
exports.raiseIssue = async (req, res) => {
    try {
        const { issueDetails } = req.body;
        const onboarding = await Onboarding.findByIdAndUpdate(
            req.params.id,
            { status: 'issue', issueDetails },
            { new: true }
        ).populate('candidateId');

        // Send email to candidate with edit link
        const editLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/edit/${onboarding._id}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: onboarding.email,
            subject: 'Onboarding Form Issue',
            html: `<p>Please review and correct the following issues in your onboarding form:</p>
                   <p>${issueDetails}</p>
                   <p><a href="${editLink}">Edit Form</a></p>`
        });

        res.json({ message: 'Issue raised and email sent', onboarding });
    } catch (error) {
        res.status(500).json({ message: 'Error raising issue', error: error.message });
    }
};

// Final onboard - create user
exports.finalOnboard = async (req, res) => {
    try {
        const { onboardingId, reportingHierarchy, joiningDate, joiningTime, joiningLocation, salary } = req.body;

        const onboarding = await Onboarding.findById(onboardingId).populate('candidateId');
        if (!onboarding || onboarding.status !== 'approved') {
            return res.status(400).json({ message: 'Invalid onboarding' });
        }

        // Create user
        const user = new User({
            fullName: onboarding.name,
            email: onboarding.email,
            password: 'defaultPassword', // Temporary password, should be changed later
            phone: onboarding.personalNumber,
            dateOfBirth: onboarding.dateOfBirth,
            gender: onboarding.gender,
            profilePictureUrl: onboarding.profilePictureUrl,
            panNumber: onboarding.panNumber,
            aadharNumber: onboarding.aadharNumber,
            currentAddress: onboarding.currentAddress,
            permanentAddress: onboarding.permanentAddress,
            fatherName: onboarding.fatherName,
            fatherDob: onboarding.fatherDob,
            fatherMobile: onboarding.fatherMobile,
            motherName: onboarding.motherName,
            motherDob: onboarding.motherDob,
            motherMobile: onboarding.motherMobile,
            bankName: onboarding.bankName,
            accountNumber: onboarding.accountNumber,
            ifscCode: onboarding.ifscCode,
            accountHolderName: onboarding.accountHolderName,
            salary: salary,
            ...reportingHierarchy,
            joiningDate,
            joiningTime,
            joiningLocation,
            role: 'Employee', // Default role
            department: 'General' // Default department
        });

        await user.save();

        // Mark onboarding as final onboard submitted
        onboarding.finalOnboardSubmitted = true;
        await onboarding.save();

        // Send confirmation email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: onboarding.email,
            subject: 'Welcome to the Company!',
            html: `<p>Welcome ${onboarding.name}! Your onboarding is complete.</p>
                   <p>Joining Date: ${joiningDate}</p>
                   <p>Joining Time: ${joiningTime}</p>
                   <p>Location: ${joiningLocation}</p>`
        });

        res.json({ message: 'Employee onboarded successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error final onboarding', error: error.message });
    }
};

// Update onboarding form
exports.updateOnboarding = async (req, res) => {
    try {
        const { id } = req.params;
        const formData = req.body;
        const files = req.files;

        // Handle file uploads
        if (req.files && req.files.profileUpload) formData.profilePictureUrl = '/uploads/' + req.files.profileUpload[0].filename;
        if (req.files && req.files.aadharUpload) formData.aadharUpload = '/uploads/' + req.files.aadharUpload[0].filename;
        if (req.files && req.files.panUpload) formData.panUpload = '/uploads/' + req.files.panUpload[0].filename;
        if (req.files && req.files.bankStatementUpload) formData.bankStatementUpload = '/uploads/' + req.files.bankStatementUpload[0].filename;

        // Update onboarding
        const onboarding = await Onboarding.findByIdAndUpdate(id, formData, { new: true });

        if (!onboarding) {
            return res.status(404).json({ message: 'Onboarding not found' });
        }

        // If status was 'issue', reset to 'pending'
        if (onboarding.status === 'issue') {
            onboarding.status = 'pending';
            await onboarding.save();
        }

        res.json({ message: 'Onboarding form updated successfully', onboarding });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating onboarding form', error: error.message });
    }
};

// Get salary for onboarding  added now
exports.getSalary = async (req, res) => {
    try {
        const onboarding = await Onboarding.findById(req.params.id).populate('candidateId');
        if (!onboarding) return res.status(404).json({ message: 'Onboarding not found' });

        const offer = await Offer.findOne({ candidateId: onboarding.candidateId._id });
        const salary = offer ? offer.salary : 0;

        res.json({ salary });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching salary', error: error.message });
    }
};

// Complete onboarding - mark as fully onboarded
exports.completeOnboarding = async (req, res) => {
    try {
        const onboarding = await Onboarding.findById(req.params.id);
        if (!onboarding || onboarding.status !== 'approved' || !onboarding.finalOnboardSubmitted) {
            return res.status(400).json({ message: 'Invalid onboarding' });
        }

        onboarding.finalOnboarded = true;
        onboarding.status = 'onboarded';
        await onboarding.save();

        res.json({ message: 'Onboarding completed successfully', onboarding });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error completing onboarding', error: error.message });
    }
};

// Send onboarding form link to candidate
exports.sendFormLink = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const formLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding-form`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Onboarding Form Link',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #1976d2; text-align: center;">Welcome to Just Tap Loans</h2>
                    <p>Dear Candidate,</p>
                    <p>Congratulations on accepting your job offer! Please complete your onboarding process by filling out the form below.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${formLink}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Onboarding Form</a>
                    </div>
                    <p>This link will remain active for 7 days. If you have any questions, please contact our HR team.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the HR Portal.</p>
                </div>
            `
        });

        res.json({ message: 'Onboarding form link sent successfully' });
    } catch (error) {
        console.error('Error sending form link:', error);
        res.status(500).json({ message: 'Error sending form link', error: error.message });
    }
};
