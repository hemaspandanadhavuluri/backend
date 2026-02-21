// This file can be used to seed banks to the database manually.
// Run with: node backend/seedBanks.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bank = require('./models/bankModel');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://13.48.131.69:27017/leadmanagementdb';

// Add your banks here in the following format:
const banksToSeed = [
    // Example:
    // {
    //     name: 'Bank Name',
    //     type: 'public', // or 'private' or 'nbfc'
    //     relationshipManagers: [
    //         {
    //             name: 'RM Name',
    //             email: 'rm.email@example.com',
    //             phoneNumber: '1234567890',
    //             region: 'North' // or 'South', 'East', 'West'
    //         }
    //     ]
    // }
];

const seedDB = async () => {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    if (banksToSeed.length === 0) {
        console.log('No banks to seed. Please add banks to the banksToSeed array in this file.');
        mongoose.connection.close();
        return;
    }

    // Use updateOne with upsert to avoid creating duplicates
    for (const bankData of banksToSeed) {
        await Bank.updateOne({ name: bankData.name }, bankData, { upsert: true });
        console.log(`Bank "${bankData.name}" has been seeded/updated.`);
    }
};

seedDB().then(() => {
    console.log('Seeding complete!');
    mongoose.connection.close();
}).catch(err => {
    console.error('Seeding failed:', err);
    mongoose.connection.close();
});
