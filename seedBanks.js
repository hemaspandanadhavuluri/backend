const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bank = require('./models/bankModel');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadmanagementdb';

const banksToSeed = [
    {
        name: 'HDFC Bank',
        relationshipManagers: [
            {
                name: 'Ramesh Kumar (HDFC)',
                email: 'ramesh.k@example-hdfc.com',
                phoneNumber: '9876543210',
                region: 'North'
            },
            {
                name: 'Sita Sharma (HDFC)',
                email: 'sita.s@example-hdfc.com',
                phoneNumber: '9876543211',
                region: 'South'
            },
            {
                name: 'Amit Patel (HDFC)',
                email: 'amit.p@example-hdfc.com',
                phoneNumber: '9876543212',
                region: 'West'
            }
        ]
    },
    {
        name: 'ICICI Bank',
        relationshipManagers: [
            {
                name: 'Priya Singh (ICICI)',
                email: 'priya.s@example-icici.com',
                phoneNumber: '8765432109',
                region: 'North'
            },
            {
                name: 'Arjun Reddy (ICICI)',
                email: 'arjun.r@example-icici.com',
                phoneNumber: '8765432108',
                region: 'South'
            },
            {
                name: 'Anjali Mehta (ICICI)',
                email: 'anjali.m@example-icici.com',
                phoneNumber: '8765432107',
                region: 'East'
            }
        ],
    },
    {
        name: 'State Bank of India',
        relationshipManagers: [
            { name: 'Sunil Gupta (SBI)', email: 'sunil.g@example-sbi.com', phoneNumber: '9123456780', region: 'North' },
            { name: 'Meena Iyer (SBI)', email: 'meena.i@example-sbi.com', phoneNumber: '9123456781', region: 'South' },
            { name: 'Vijay Chavan (SBI)', email: 'vijay.c@example-sbi.com', phoneNumber: '9123456782', region: 'West' },
            { name: 'Deepak Das (SBI)', email: 'deepak.d@example-sbi.com', phoneNumber: '9123456783', region: 'East' },
        ]
    },
    {
        name: 'Punjab National Bank',
        relationshipManagers: [
            { name: 'Anita Verma (PNB)', email: 'anita.v@example-pnb.com', phoneNumber: '9234567890', region: 'North' },
            { name: 'Rajesh Nair (PNB)', email: 'rajesh.n@example-pnb.com', phoneNumber: '9234567891', region: 'South' },
            { name: 'Prakash Joshi (PNB)', email: 'prakash.j@example-pnb.com', phoneNumber: '9234567892', region: 'West' },
        ]
    },
    {
        name: 'Bank of Baroda',
        relationshipManagers: [
            { name: 'Geeta Singh (BOB)', email: 'geeta.s@example-bob.com', phoneNumber: '9345678901', region: 'North' },
            { name: 'Kumar Pillai (BOB)', email: 'kumar.p@example-bob.com', phoneNumber: '9345678902', region: 'South' },
            { name: 'Sachin Desai (BOB)', email: 'sachin.d@example-bob.com', phoneNumber: '9345678903', region: 'West' },
        ]
    },
    {
        name: 'Axis Bank',
        relationshipManagers: [
            { name: 'Vikram Batra (Axis)', email: 'vikram.b@example-axis.com', phoneNumber: '9456789012', region: 'North' },
            { name: 'Lakshmi Menon (Axis)', email: 'lakshmi.m@example-axis.com', phoneNumber: '9456789013', region: 'South' },
            { name: 'Sourav Bannerjee (Axis)', email: 'sourav.b@example-axis.com', phoneNumber: '9456789014', region: 'East' },
        ]
    },
    {
        name: 'Kotak Mahindra Bank',
        relationshipManagers: [
            { name: 'Neha Sharma (Kotak)', email: 'neha.s@example-kotak.com', phoneNumber: '9567890123', region: 'North' },
            { name: 'Anand Krishnan (Kotak)', email: 'anand.k@example-kotak.com', phoneNumber: '9567890124', region: 'South' },
            { name: 'Rohan Mehta (Kotak)', email: 'rohan.m@example-kotak.com', phoneNumber: '9567890125', region: 'West' },
        ]
    },
    {
        name: 'IndusInd Bank',
        relationshipManagers: [
            { name: 'Pooja Khanna (IndusInd)', email: 'pooja.k@example-indusind.com', phoneNumber: '9678901234', region: 'North' },
            { name: 'Sanjay Rao (IndusInd)', email: 'sanjay.r@example-indusind.com', phoneNumber: '9678901235', region: 'West' },
        ]
    },
    {
        name: 'Yes Bank',
        relationshipManagers: [
            { name: 'Kavita Rao (Yes)', email: 'kavita.r@example-yes.com', phoneNumber: '9789012345', region: 'South' },
            { name: 'Manish Agarwal (Yes)', email: 'manish.a@example-yes.com', phoneNumber: '9789012346', region: 'West' },
        ]
    },
    {
        name: 'Canara Bank',
        relationshipManagers: [
            { name: 'Alok Sharma (Canara)', email: 'alok.s@example-canara.com', phoneNumber: '9890123456', region: 'North' },
            { name: 'Prakasham L (Canara)', email: 'prakasham.l@example-canara.com', phoneNumber: '9890123457', region: 'South' },
        ]
    },
    {
        name: 'Union Bank of India',
        relationshipManagers: [
            { name: 'Rajeshwari Singh (Union)', email: 'rajeshwari.s@example-union.com', phoneNumber: '9901234567', region: 'North' },
            { name: 'Murali Krishna (Union)', email: 'murali.k@example-union.com', phoneNumber: '9901234568', region: 'South' },
            { name: 'Iqbal Khan (Union)', email: 'iqbal.k@example-union.com', phoneNumber: '9901234569', region: 'West' },
        ]
    }
];

const seedDB = async () => {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding...');

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