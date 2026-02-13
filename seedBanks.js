const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bank = require('./models/bankModel');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://13.48.131.69:27017/leadmanagementdb';

const banksToSeed = [
    {
        name: 'Credila',
        relationshipManagers: [
            {
                name: 'John Doe (Credila)',
                email: 'john.doe@example-credila.com',
                phoneNumber: '9876543210',
                region: 'North'
            },
            {
                name: 'Jane Smith (Credila)',
                email: 'jane.smith@example-credila.com',
                phoneNumber: '9876543211',
                region: 'South'
            }
        ]
    },
    {
        name: 'Avanse',
        relationshipManagers: [
            {
                name: 'Alice Johnson (Avanse)',
                email: 'alice.johnson@example-avanse.com',
                phoneNumber: '8765432109',
                region: 'North'
            },
            {
                name: 'Bob Brown (Avanse)',
                email: 'bob.brown@example-avanse.com',
                phoneNumber: '8765432108',
                region: 'South'
            }
        ]
    },
    {
        name: 'Incred',
        relationshipManagers: [
            {
                name: 'Charlie Wilson (Incred)',
                email: 'charlie.wilson@example-incred.com',
                phoneNumber: '7654321098',
                region: 'West'
            },
            {
                name: 'Diana Lee (Incred)',
                email: 'diana.lee@example-incred.com',
                phoneNumber: '7654321097',
                region: 'East'
            }
        ]
    },
    {
        name: 'Auxilo',
        relationshipManagers: [
            {
                name: 'Eve Davis (Auxilo)',
                email: 'eve.davis@example-auxilo.com',
                phoneNumber: '6543210987',
                region: 'North'
            },
            {
                name: 'Frank Miller (Auxilo)',
                email: 'frank.miller@example-auxilo.com',
                phoneNumber: '6543210986',
                region: 'South'
            }
        ]
    },
    {
        name: 'Tata Capital',
        relationshipManagers: [
            {
                name: 'Grace Taylor (Tata Capital)',
                email: 'grace.taylor@example-tatacapital.com',
                phoneNumber: '5432109876',
                region: 'West'
            },
            {
                name: 'Henry Anderson (Tata Capital)',
                email: 'henry.anderson@example-tatacapital.com',
                phoneNumber: '5432109875',
                region: 'East'
            }
        ]
    },
    {
        name: 'ICICI',
        relationshipManagers: [
            {
                name: 'Priya Singh (ICICI)',
                email: 'priya.singh@example-icici.com',
                phoneNumber: '8765432109',
                region: 'North'
            },
            {
                name: 'Arjun Reddy (ICICI)',
                email: 'arjun.reddy@example-icici.com',
                phoneNumber: '8765432108',
                region: 'South'
            }
        ]
    },
    {
        name: 'Axis',
        relationshipManagers: [
            {
                name: 'Vikram Batra (Axis)',
                email: 'vikram.batra@example-axis.com',
                phoneNumber: '9456789012',
                region: 'North'
            },
            {
                name: 'Lakshmi Menon (Axis)',
                email: 'lakshmi.menon@example-axis.com',
                phoneNumber: '9456789013',
                region: 'South'
            }
        ]
    },
    {
        name: 'IDFC',
        relationshipManagers: [
            {
                name: 'Ivy Garcia (IDFC)',
                email: 'ivy.garcia@example-idfc.com',
                phoneNumber: '4321098765',
                region: 'West'
            },
            {
                name: 'Jack Martinez (IDFC)',
                email: 'jack.martinez@example-idfc.com',
                phoneNumber: '4321098764',
                region: 'East'
            }
        ]
    },
    {
        name: 'Propelled',
        relationshipManagers: [
            {
                name: 'Karen Rodriguez (Propelled)',
                email: 'karen.rodriguez@example-propelled.com',
                phoneNumber: '3210987654',
                region: 'North'
            },
            {
                name: 'Leo Hernandez (Propelled)',
                email: 'leo.hernandez@example-propelled.com',
                phoneNumber: '3210987653',
                region: 'South'
            }
        ]
    },
    {
        name: 'SBI',
        relationshipManagers: [
            {
                name: 'Sunil Gupta (SBI)',
                email: 'sunil.gupta@example-sbi.com',
                phoneNumber: '9123456780',
                region: 'North'
            },
            {
                name: 'Meena Iyer (SBI)',
                email: 'meena.iyer@example-sbi.com',
                phoneNumber: '9123456781',
                region: 'South'
            }
        ]
    },
    {
        name: 'UBI',
        relationshipManagers: [
            {
                name: 'Rajeshwari Singh (UBI)',
                email: 'rajeshwari.singh@example-ubi.com',
                phoneNumber: '9901234567',
                region: 'North'
            },
            {
                name: 'Murali Krishna (UBI)',
                email: 'murali.krishna@example-ubi.com',
                phoneNumber: '9901234568',
                region: 'South'
            }
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