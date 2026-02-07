const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BankComparison = require('./models/bankComparisonModel');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadmanagementdb';

const bankComparisonsToSeed = [
    {
        bankName: 'Union Bank Of India',
        type: 'public',
        disadvantages: [
            'Very High Loan Margin: Students think the loan margin in the case of Union Bank is always 15%. But, it is not true. Many students these days are attracted to the UBI\'s 40 lacs unsecured loan which is given to only the top 180 universities globally. 90% of these universities are expensive and hence the average total expenses (fee living expenses) in these universities is about 60 lacs of above. In this case, the loan margin will be 33% instead of the standard 15%. This means that when you want for example 10 lacs disbursement, the bank will ask you to bring in 3.3 lacs (33%) as part of the loan margin concept. The same thing will be followed for all the disbursements. If you have to bring in such a huge amount upfront, then what is the use of taking an education loan? Many students had to drop their study abroad plans due to this.',
            'No Pre-Visa disbursements: UBI does not support Pre-Visa disbursements, which means if your university/ embassy has a condition of depositing some amount before you get your visa approved, then UBI will not release a single penny before your visa. For ex. GIC in Canada/ Blocked account in Germany and so on in other countries too.',
            'Disbursement issues: if you are living off-campus in private accommodation, then living expenses disbursement in UBI is a tedious process as you have to submit the bills every month without fail for every penny you spend. Many students find this as an unnecessary and annoying process when compared to other banks.',
            'Deducting EMI Without Student\'s Knowledge: Many students reported to us that UBI started deducting EMIs suddenly even when the moratorium period was going on without obtaining student\'s consent, in a lot of cases, this issue has impacted student\'s and co-applicant\'s CIBIL, very badly.'
        ],
        justTapAdvantages: [
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Transparent EMI Management: Clear communication and consent required for all EMI deductions, protecting your CIBIL score during moratorium periods.'
        ]
    },
    {
        bankName: 'Bank of Baroda',
        type: 'public',
        disadvantages: [
            'Frequent Rate of Interest hike: When compared to other banks, BOB has one of the highest rate hikes, Post the disbursement, many students have complained that the interest rates were hiked every 6 months by 0.50% making it close to 12-13% by the end of the course duration.',
            'No Pre-Visa disbursements: BOB does not support Pre-Visa disbursements, which means if your university has a condition of depositing some amount before you get your visa approved, then BOB cannot help you.',
            'Disbursement issues: If you are living off-campus, then living expenses disbursement in BOB is a tedious process as you have to submit the bills every month without fail of every penny you spend. Many students find this as an unnecessary and annoying process when compared to other banks.',
            'High processing time: As per the reports, the average timeline of BOB loan sanction is 2-3 months. Also, there is no digital system to track your file, unlike other banks. The legal process of collateral is very strict which keeps you running from pillar to post to get the reports ready. To make it worse, there are multiple processing centers involved in getting your loan approved.'
        ],
        justTapAdvantages: [
            'Stable Interest Rates: Just Tap Capital offers fixed interest rates with no hidden hikes, ensuring predictable EMI payments throughout your course duration.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements for visa processing.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Fast Processing: Quick loan sanction within 2-4 weeks with digital tracking system and simplified collateral process through our network.'
        ]
    },
    {
        bankName: 'Canara Bank',
        type: 'public',
        disadvantages: [
            'Very High Rate of Interest: Canara Bank is charging a very high Rate of Interest for their Education Loans and the range varies from 10.85% to 11.35%. When compared to other banks like Karur Vysya Bank (KVB), Canara Bank charges more than 1% higher and hence it is not recommended if you are looking for the lowest interest rate in India. You may check the rates live on the bank\'s official website at: https://canarebank.com/pages/rates-of-interest-for-retail-lending-schemes-linked-to-dir',
            'Living Expenses Disbursement Issues: If you are living off-campus in private accommodation, then living expenses disbursement in Canara Bank is a tedious process as you have to submit the bills every month without fail for every penny you spend. Many students find this as an unnecessary and annoying process when compared to other banks.',
            'Very High Loan Margin: Students think the loan margin in the case of Canara Bank is always 15%. But, it is not true, Based on the total expenses (fee+ living expenses), students have reported that the loan margin has gone even to 50% also. It means that when you want for example 10 lacs disbursement, the bank will ask you to bring in 5 lacs (50%) as part of the loan margin concept. The same thing will be followed for all the disbursements. If you have to bring in such a huge amount upfront, then what is the use of taking an education loan? Many students had to drop their study abroad plans due to this, even after getting a loan from Canara Bank.',
            'NO Pre-Visa disbursements: Canara Bank does not support Pre-Visa disbursements, which means if your university/ embassy has a condition of depositing some amount before you get your visa approved, then Canara Bank will not release a single penny before your visa. For ex. GIC in Canada/ Blocked account in Germany and so on in other countries too.',
            'Deducting EMI Without Student\'s Knowledge: Many students reported to us that Canara Bank started deducting EMIs suddenly without obtaining the student\'s consent, even when the moratorium period was going on. In a lot of cases, this issue has impacted students\' and co-applicants\' CIBIL very badly.'
        ],
        justTapAdvantages: [
            'Competitive Interest Rates: Just Tap Capital offers lower interest rates compared to traditional banks, starting from 9.5% for education loans.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Transparent EMI Management: Clear communication and consent required for all EMI deductions, protecting your CIBIL score during moratorium periods.'
        ]
    },
    {
        bankName: 'Bank of India',
        type: 'public',
        disadvantages: [
            'Very High Rate of Interest: BOI is charging a very high Rate of Interest for their Education Loans and the range varies from 11% to 12.25%. When compared to other banks like Karur Vysya Bank (KVB), BOI charges more than 1% higher and hence it is not recommended if you are looking for the lowest interest rate in India. You may check the rates live on the bank\'s official website at: https://bankofindia.co.in/education-loan/star-education-loan-studies-abroad',
            'Very High Loan Margin: Students think the loan margin in the case of BOI is always 15%. But, it is not true, Based on the total expenses (fee+ living expenses), students have reported that the loan margin has gone even to 50% also. It means that when you want for example 10 lacs disbursement, the bank will ask you to bring in 5 lacs (50%) as part of the loan margin concept. The same thing will be followed for all the disbursements. If you have to bring in such a huge amount upfront, then what is the use of taking an education loan? Many students had to drop their study abroad plans due to this, even after getting a loan from BOI.',
            'Living Expenses Disbursement Issues: If you are living off-campus in private accommodation, then living expenses disbursement in BOI is a tedious process as you have to submit the bills every month without fail for every penny you spend. Many students find this as an unnecessary and annoying process when compared to other banks.',
            'NO Pre-Visa disbursements: BOI does not support Pre-Visa disbursements, which means if your university/ embassy has a condition of depositing some amount before you get your visa approved, then BOI will not release a single penny before your visa. For ex. GIC in Canada/ Blocked account in Germany and so on in other countries too.',
            'Deducting EMI Without Student\'s Knowledge: Many students reported to us that BOI started deducting EMIs suddenly without obtaining the student\'s consent, even when the moratorium period was going on. In a lot of cases, this issue has impacted student\'s and co-applicant\'s CIBIL very badly.'
        ],
        justTapAdvantages: [
            'Competitive Interest Rates: Just Tap Capital offers lower interest rates compared to traditional banks, starting from 9.5% for education loans.',
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Transparent EMI Management: Clear communication and consent required for all EMI deductions, protecting your CIBIL score during moratorium periods.'
        ]
    },
    {
        bankName: 'Punjab National Bank',
        type: 'public',
        disadvantages: [
            'Very High Rate of Interest: PNB is charging a very high Rate of interest for their Education Loans and the range varies from 10.85% to 12.25%. When compared to other banks like Karur Vysya Bank (KVB), PNB charges more than 1% higher and hence it is not recommended if you are looking for the lowest interest rate in India. You may check the rates live on the bank\'s official website at: https:cowwow.pobindia.in/interst-rate-on-advances-linked-to-mcir.html#educationica',
            'Very High Loan Margin: Students think the loan margin in the case of PNB Is always 15%. But, it is not true. Based on the total expenses (fee living expenses), students have reported that the loan margin has gone even to 50% also. It means that when you want for example 10 lacs disbursement, the bank will ask you to bring in 5 lacs (50%) as part of the loan margin concept. The same thing will be followed for all the disbursements. If you have to bring in such a huge amount upfront, then what is the use of taking an education loan? Many students had to drop their study abroad plans due to this, even after getting a loan from PNB.',
            'Living Expenses Disbursement Issues: If you are living off-campus in private accommodation, then living expenses disbursement in PNB is a tedious process as you have to submit the bills every month without fail for every penny you spend.Many students find this as an unnecessary and annoying process when compared to other banks.',
            'NO Pre-Visa disbursements: PNB does not support Pre-Visa disbursements, which means if your university embassy has a condition of depositing some amount before you get your visa approved, then PNB will not release a single penny before your visa. For ex. GIC in Canada/ Blocked account in Germany and so on in other countries too.',
            'Deducting EMI Without Student\'s Knowledge: Many students reported to us that PNB started deducting EMis suddenly without obtaining the student\'s consent, even when the moratorium period was going on. In a lot of cases, this issue has impacted students\' and co-applicant\'s CIBIL very badly.'
        ],
        justTapAdvantages: [
            'Competitive Interest Rates: Just Tap Capital offers lower interest rates compared to traditional banks, starting from 9.5% for education loans.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Transparent EMI Management: Just Tap Capital offers lower interest rates compared to traditional banks, starting from 9.5% for education loans.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Transparent EMI Management: Clear communication and consent required for all EMI deductions, protecting your CIBIL score during moratorium periods.'
        ]
    },
    {
        bankName: 'Credila',
        type: 'private',
        disadvantages: [
            'Higher rate of interest: Public banks are offering Education loans as low as Check 9.75-10% interest rates. Credila has rates starting from 11.5%, which is very high. Check the difference using the EMI at the https:bit.ly/EducationtLoan_EMI_Calculator',
            'Interest rates hiked: Many students who took their loan from Credila have reported that their interest rate was hiked by 1-1.5% within 12-14 months after the loan was disbursed. This drastically increased their repayment amount as they had to pay a few lacs extra',
            'Compound Interest charged: Credila charges compound interest during the moratorium period (course duration + 1 year). This makes your repayment about twice the principal amount.',
            'Higher processing fee: Public banks charge a very low flat processing fee of Rs. 12,000 and a few of them refund it too. While Credila charges 1-1.25%+ GST of the loan amount as the processing fee, which is high. (Ex: Credila\'s fee for a 40L loan will be a minimum of 50,000)',
            'Higher Insurance Charged: Credila is approximately charging 15-20% higher insurance than any other banks/ lenders in the education loan industry'
        ],
        justTapAdvantages: [
            'Competitive Interest Rates: Just Tap Capital offers lower interest rates compared to traditional banks, starting from 9.5% for education loans.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Transparent EMI Management: Clear communication and consent required for all EMI deductions, protecting your CIBIL score during moratorium periods.'
        ]
    },
    {
        bankName: 'USD Lenders',
        type: 'private',
        disadvantages: [
            'Very High Rate of Interest: USD Lenders like Prodigy/ MPower Finance are charging a very high Rate of Interest for their Education Loans and the range varies from 11.5% to 14.5%. When compared to other Indian banks like Karur Vysya Bank (KVB). USD lenders charge more than 2% to 4% higher and hence it is not recommended if you are looking for the lowest interest rate in india.',
            'Interest rate parity factor. This is the toughest to explain, but the most important to understand. If you get it, you will realize 11% Rate of interest from a US lender is equivalent to 16% ROI from an Indian lender. Which means, to equate the rate offered by the USD lender to the Indian lender, you have to roughly add 5% to the rate offered by the USD lender. Check out the USD to INR Education loan Calculator to get more clarity by comparing USD and INR loan, which I will share with you right after the call.',
            'No Income Tax exemptions: If you opt for USD lenders, then you will not be able to get tax  exemptions under Income Tax section 80E which the student or co-applicant can claim for the next 8 years. At the same time, if you opt for RBI-approved lenders in india, then you can claim these tax benefits, that too without any upper cap limit.',
            'Very High Processing fee: USD lenders like Prodigy and MPower Finance charge 4% and 5% respectively. Contrarily, processing fees charged by Indlan private lenders range between 0.75% to 1% and public banks in India charge even less. Hence, students save a good amount by opting for INR loans.',
            'Disbursement issues: USD lenders check the semester scores achieved by the student to release the further disbursements. Many times, students complained that they could not get the funds released on time due to such stringent checkups. INR lenders do not need such a documentation process to release funds.'
        ],
        justTapAdvantages: [
            'Competitive Interest Rates: Just Tap Capital offers lower interest rates compared to traditional banks, starting from 9.5% for education loans.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Transparent EMI Management: Clear communication and consent required for all EMI deductions, protecting your CIBIL score during moratorium periods.'
        ]
    },
    
    {
        bankName: 'Public Banks',
        type: 'public',
        disadvantages: [
            'Very Long processing time: As you know when a collateral is involved, the legal valuation process has to be done properly by the bank. Hence secured loans will take a very long processing time of at least 1.5 to 2 months.',
            'Living expenses disbursement: Usually in secured loans, the banks ask you to spend for the living expenses like accommodation, food etc, and then ask you to produce the receipt for the reimbursement. This is very annoying for students as they have to spend first from their pocket and take from the bank after every 4-5 months by keeping the bills of all transactions.',
            'Fee disbursement via 3rd party software: Most of the universities abroad these days do not accept fee payment directly to their bank account. Instead they have tied up with 3rd party software companies like Flywire/ GlobalPay, wherein the student has to first pay to these companies and then they pay the amount to the university. When you go for secured loans, banks don\'t pay to such 3rd party software companies and instead ask you to pay first from your pocket and reimburse later from the bank. This is very annoying for students',
            'Pre-visa disbursement: Most of the embassies these days ask to pay the fee/living expenses before going for the visa- called as pre-visa disbursement. When you go for secured loans, banks cannot go for pre-visa disbursement and instead ask you to pay first from your pocket and reimburse later from the bank. This is very annoying for students'
        ],
        justTapAdvantages: [
            'Competitive Interest Rates: Just Tap Capital offers lower interest rates compared to traditional banks, starting from 9.5% for education loans.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Transparent EMI Management: Clear communication and consent required for all EMI deductions, protecting your CIBIL score during moratorium periods.'
        ]
    },
    {
        bankName: 'Private Banks',
        type: 'private',
        disadvantages: [
            'Very High Interest Rates and Rapid Interest rate fluctuations: As you\'re approaching these banks directly and you are likely to be unaware of the current market rates most of these lenders charge very high interest rates. To attract students some of these lenders might charge quite lower rates in the beginning but once the loan is sanctioned and disbursed they increase the rates rapidly claiming it to be under the REPO rates. This sudden increase in the interest rates becomes a huge burden for students during their repayment. A lot of students whom I have connected to bank also came back to me sharing the same concern and that is the reason in the recent past I have been suggesting bank as the last option for all my students. Meanwhile, all those students who are approaching through Just Tap Capital will not have much concerns about the interest rates as they have an upper hand with the negotiations because we can bring up to 2% discount in the ROI and offer students the lowest deal possible in the market and with respect to fluctuating Interest rates, as all our students avail the Interest rate protection scheme they do not have to worry about the constant hike in interest rates too, they can reach out to us incase they face such issues and we will make sure that their interest rates are brought back to the lowest rates possible.',
            'Disbursement issues: Though they promise a very smooth process. Most of my students who have taken loans from this bank, have repeatedly shared their concerns that as their disbursement process takes too long, they were unable to pay their fees on time and faced a lot of issues due to not having enough funds on time.'
        ],
        justTapAdvantages: [
            'Competitive Interest Rates: Just Tap Capital offers lower interest rates compared to traditional banks, starting from 9.5% for education loans.',
            'Streamlined Disbursements: Easy and hassle-free disbursement process for living expenses without monthly bill submissions.',
            'Flexible Loan Margin: Just Tap Capital offers competitive loan margins starting from 15% without hidden increases based on university selection.',
            'Pre-Visa Disbursements: We support pre-visa disbursements to meet university and embassy requirements, including GIC in Canada and blocked accounts in Germany.',
            'Transparent EMI Management: Clear communication and consent required for all EMI deductions, protecting your CIBIL score during moratorium periods.'
        ]
    }
];

const seedDB = async () => {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding bank comparisons...');

    for (const comparisonData of bankComparisonsToSeed) {
        await BankComparison.updateOne({ bankName: comparisonData.bankName }, comparisonData, { upsert: true });
        console.log(`Bank comparison for "${comparisonData.bankName}" has been seeded/updated.`);
    }
};

seedDB().then(() => {
    console.log('Seeding bank comparisons complete!');
    mongoose.connection.close();
}).catch(err => {
    console.error('Seeding bank comparisons failed:', err);
    mongoose.connection.close();
});
