// src/controllers/userController.js
const User = require('../models/userModel');
const Bank = require('../models/bankModel'); // Import the Bank model
// const bcrypt = require('bcryptjs'); // Needed for real-world password hashing
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'justtapnagendra@gmail.com',
        pass: 'lfxs gaqv ldyd rwnj'
    }
});

/**
 * Creates a new user/employee (HR, FO, Head, etc.).
 * @route POST /api/users/register
 */
exports.registerUser = async (req, res) => {
    const {
        name, personalNumber, email, dateOfBirth, gender, panNumber, aadharNumber,
        currentAddress, permanentAddress, fatherName, fatherDob, fatherMobile,
        motherName, motherDob, motherMobile, zone, region, role,
        reporting_hr, reporting_fo, reporting_zonalHead, reporting_regionalHead, reporting_ceo
    } = req.body;

    // Files from multer
    const aadharUpload = req.files?.aadharUpload ? req.files.aadharUpload[0].path : null;
    const panUpload = req.files?.panUpload ? req.files.panUpload[0].path : null;
    const profileUpload = req.files?.profileUpload ? req.files.profileUpload[0].path : null;

    if (!name || !email || !role) {
        return res.status(400).json({ message: 'Please include full name, email, and role.' });
    }

    try {
        // 1. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: 'User with that email already exists.' });
        }

        // 2. Hash Password (MOCK: Skipping real hashing for brevity, using a default or generated password)
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);
        const hashedPassword = 'defaultpassword'; // MOCK: Store plain password temporarily

        // 3. Create User
        const user = await User.create({
            fullName: name,
            email,
            password: hashedPassword,
            phoneNumber: personalNumber,
            dateOfBirth,
            gender,
            panNumber,
            aadharNumber,
            currentAddress,
            permanentAddress,
            fatherName,
            fatherDob,
            fatherMobile,
            motherName,
            motherDob,
            motherMobile,
            aadharFilePath: aadharUpload,
            panFilePath: panUpload,
            profilePictureUrl: profileUpload,
            role,
            zone: ['ZonalHead', 'RegionalHead', 'FO'].includes(role) ? zone : undefined,
            region: ['RegionalHead', 'FO'].includes(role) ? region : undefined,
            reporting_hr,
            reporting_fo,
            reporting_zonalHead,
            reporting_regionalHead,
            reporting_ceo,
        });

        if (user) {
            // Send back necessary user data (excluding password)
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                zone: user.zone,
                region: user.region,
                message: `${user.role} account created successfully.`
            });
        } else {
            res.status(400).json({ message: 'Invalid user data received.' });
        }
    } catch (error) {
        console.error('User registration error:', error);
        res.status(500).json({ message: 'Server error during user creation.' });
    }
};

// Export multer middleware for use in routes
exports.uploadFiles = upload.fields([
    { name: 'aadharUpload', maxCount: 1 },
    { name: 'panUpload', maxCount: 1 },
    { name: 'profileUpload', maxCount: 1 }
]);

/**
 * Fetches all Zonal Heads and Regional Heads for dropdowns.
 * @route GET /api/users/managers
 */
exports.getManagers = async (req, res) => {
    try {
        const managers = await User.find({
            role: { $in: ['ZonalHead', 'RegionalHead'] }
        }).select('_id fullName role');

        const zonalHeads = managers.filter(m => m.role === 'ZonalHead').map(m => ({ id: m._id, name: m.fullName }));
        const regionalHeads = managers.filter(m => m.role === 'RegionalHead').map(m => ({ id: m._id, name: m.fullName }));

        res.status(200).json({ zonalHeads, regionalHeads });
    } catch (error) {
        console.error('Error fetching managers:', error);
        res.status(500).json({ message: 'Server error fetching managers.' });
    }
};

/**
 * Sends OTP to employee's email or mobile.
 * @route POST /api/users/send-otp
 */
exports.sendOTP = async (req, res) => {
    const { identifier } = req.body; // identifier can be email or mobile number

    if (!identifier) {
        return res.status(400).json({ message: 'Please provide email or mobile number.' });
    }

    try {
        let isBankExecutive = false;
        let userDetailsForOtp;
        let user;

        // 1. Check if the identifier belongs to a Bank Executive
        const bank = await Bank.findOne({ 'relationshipManagers.email': identifier });
        if (bank) {
            const rm = bank.relationshipManagers.find(r => r.email === identifier);
            if (rm) {
                isBankExecutive = true;
                // Create a temporary user-like object for the OTP process
                userDetailsForOtp = {
                    _id: new mongoose.Types.ObjectId(), // Temporary ID for the process
                    fullName: rm.name,
                    email: rm.email,
                    role: 'BankExecutive',
                    bank: bank.name
                };
                user = userDetailsForOtp; // Use this object for sending OTP
            }
        } else {
            // 2. If not a bank exec, check for an internal employee
            user = await User.findOne({
                $or: [{ email: identifier }, { phoneNumber: identifier }]
            });
        }

        if (!user) return res.status(404).json({ message: 'User or Bank Executive not found with the provided identifier.' });

        // 3. Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Send OTP via email if identifier is an email
        if (identifier.includes('@')) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: identifier,
                subject: 'Your OTP for Employee Login',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #1976d2; text-align: center;">Employee Portal Login</h2>
                        <p>Hello ${user.fullName},</p>
                        <p>Your One-Time Password (OTP) for login is:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; color: #1976d2; background: #f5f5f5; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">${otp}</span>
                        </div>
                        <p>This OTP will expire in 5 minutes.</p>
                        <p>If you didn't request this OTP, please ignore this email.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from the Employee Portal.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ OTP email sent to ${identifier}: ${otp}`);
        } else {
            // For mobile numbers, you would integrate with SMS service like Twilio
            // For now, we'll just log it
            console.log(`📱 OTP SMS to ${identifier}: ${otp}`);
        }

        // 4. Store OTP with user details
        global.otpStore = global.otpStore || {};
        global.otpStore[identifier] = { 
            otp, 
            userDetails: user, // Store the full user or user-like object
            isBankExecutive,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        };

        res.status(200).json({ message: 'OTP sent successfully.' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Server error sending OTP.' });
    }
};

/**
 * Verifies OTP and logs in the employee.
 * @route POST /api/users/verify-otp
 */
exports.verifyOTP = async (req, res) => {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
        return res.status(400).json({ message: 'Please provide identifier and OTP.' });
    }

    try {
        const storedOTP = global.otpStore?.[identifier];

        if (!storedOTP || storedOTP.otp !== otp || Date.now() > storedOTP.expiresAt) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // OTP is valid, use the user details stored during OTP sending
        const userDetails = storedOTP.userDetails;

        // Clear the OTP after successful verification
        delete global.otpStore[identifier];

        // Construct the final user object for the frontend
        const userForFrontend = {
            _id: userDetails._id,
            fullName: userDetails.fullName,
            email: userDetails.email,
            phoneNumber: userDetails.phoneNumber,
            role: userDetails.role,
            zone: userDetails.zone,
            region: userDetails.region,
            bank: userDetails.bank
        };

        res.status(200).json({
            message: 'Login successful.',
            user: userForFrontend
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Server error verifying OTP.' });
    }
};
