const mongoose = require('mongoose');

// --- 1. Embedded Sub-Schemas (Unchanged) ---

// TestScores Sub-Schema
const TestScoresSchema = new mongoose.Schema({
  GRE: { type: String, default: "" },
  IELTS: { type: String, default: "" },
  TOEFL: { type: String, default: "" },
  GMAT: { type: String, default: ""
    
   },
  SAT: { type: String, default: "" },
  PTE: { type: String, default: "" },
  ACT: { type: String, default: "" },
  DUOLINGO: { type: String, default: "" },
}, { _id: false });

// Source Sub-Schema (Made 'source' required for initial lead capture)
const SourceSchema = new mongoose.Schema({
  source: { type: String, required: true }, // REQUIRED for initial capture
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
}, { _id: false });

// Reference Sub-Schema (for Security Persons)
const ReferenceSchema = new mongoose.Schema({
  relationship: { type: String, default: '' },
  name: { type: String, default: '' },
  address: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
}, { _id: false });

// Co-Applicant Sub-Schema
const CoApplicantSchema = new mongoose.Schema({
  relationshipType: { type: String, default: '' },
  name: { type: String, default: '' },
  employmentType: { type: String, default: '' },
  annualIncome: { type: Number, default: 0 },
  phoneNumber: { type: String, default: '' },
  currentObligations: { type: String, default: '' },
  cibilScore: { type: String, default: '' },
  cibilIssues: { type: String, default: '' },
  isCoApplicant: { type: Boolean, default: false },
  isDivorced: { type: Boolean, default: false },
  documents: { type: [String], default: [] }, // NEW: To track collected documents
  knowsCoApplicant: { type: Boolean, default: true },
}, { _id: false });

// ReferralListItem Sub-Schema
const ReferralListItemSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    code: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
}, { _id: false });

// --- NEW: Sanction Details Sub-Schema ---
const SanctionDetailsSchema = new mongoose.Schema({
    rateOfInterest: { type: String, default: '' },
    processingFeePaid: { type: Boolean, default: false },
    disbursementDone: { type: Boolean, default: false },
    coApplicant: { type: String, default: '' },
    loanSecurity: { type: String, enum: ['Secure', 'Unsecure', ''] },
    loanAmount: { type: Number, default: 0 },
    sanctionDate: { type: Date }
}, { _id: false });

// --- NEW: Approached Bank Sub-Schema ---
const ApproachedBankSchema = new mongoose.Schema({
  bankName: { type: String, default: '' },
  fileLoggedIn: { type: Boolean, default: false },
  loanSanctioned: { type: Boolean, default: false },
  sanctionDetails: { type: SanctionDetailsSchema, default: () => ({}) }
}, { _id: false });

// --- 2. NEW Embedded Call Note Sub-Schema ---
const EmbeddedCallNoteSchema = new mongoose.Schema({
    loggedById: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    loggedByName: { type: String, required: true },
    notes: { type: String, required: true },
    callStatus: { 
        type: String, 
        enum: ['Connected', 'Not Reached', 'Busy', 'Scheduled', 'Log'],
        default: 'Connected' 
    },
    nextCallDate: { type: Date }, // Optional reminder date set during the call
}, { timestamps: true }); // Tracks when the note was created

// --- NEW: Bank Assignment Sub-Schema ---
const BankAssignmentSchema = new mongoose.Schema({
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
    bankName: { type: String, required: true },
    assignedRMName: { type: String }, // Name of the assigned Relationship Manager
    assignedRMEmail: { type: String }, // Email of the assigned RM
    assignedAt: { type: Date, default: Date.now },
}, { _id: false });

// --- NEW: Document Sub-Schema ---
const DocumentSchema = new mongoose.Schema({
    documentType: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

// --- 3. Main Lead Schema (Updated) ---
const LeadSchema = new mongoose.Schema({
  // 1. Metadata & Basic Info
  leadID: { type: String, required: true, unique: true }, 
  fullName: { type: String, required: true }, // MADE REQUIRED for initial capture
  email: { type: String }, // Made optional if not captured initially
  mobileNumbers: { 
      type: [String], 
      required: true, 
      validate: [v => v && v.length > 0, 'At least one mobile number is required'] 
  }, // MADE REQUIRED for initial capture
  permanentLocation: { type: String },
  currentAddress: { type: String },
  state: { type: String },
  region: { type: String },
  zone: { type: String },
  regionalHead: { type: String },
  zonalHead: { type: String },
  planningToStudy: { type: String },
  source: { type: SourceSchema }, // MADE REQUIRED for initial capture
  
  // Assignee Information
  assignedFOId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedFO: { type: String },
  assignedFOPhone: { type: String },
  counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  counsellorName: { type: String },
  counsellorEmail: { type: String },
  studentAppliedDate: { type: Date, default: Date.now },
  studentAppliedTime: { type: String },

  // 2. Education / Loan Info
  loanId: { type: String },
  loanType: { type: String },
  courseStartMonth: { type: String },
  courseStartYear: { type: String },
  degree: { type: String },
  fieldOfInterest: { type: String },
  interestedCountries: { type: [String], default: [] },
  admitReceived: { type: Boolean, default: false },
  admittedUniversities: { type: [String], default: [] },
  expectedAdmitDate: { type: Date },
  expectedApplicationDate: { type: Date },

  // --- REFACTORED: Bank Approach Details ---
  approachedAnyBank: { type: Boolean, default: false },
  approachedBanks: { type: [ApproachedBankSchema], default: [] },

  // --- RE-ADD: Top-level Sanction Details for Final Status ---
  sanctionDetails: { type: SanctionDetailsSchema, default: () => ({}) },

  // 3. Test Scores (Embedded Document)
  testScores: { type: TestScoresSchema, default: {} },

  // 4. Financial Info
  age: { type: Number },
  workExperience: { type: String },
  hasStudentLoans: { type: Boolean, default: false },
  studentLoanDetails: { type: String },
  courseDuration: { type: String },
  fee: { type: Number },
  originalFee: { type: Number },
  originalFeeCurrency: { type: String },
  conversionRate: { type: Number },
  living: { type: Number },
  otherExpenses: { type: Number },
  loanAmountRequired: { type: Number },
  maxUnsecuredGivenByUBI: { type: Number },
  hasAssets: { type: Boolean, default: false },
  listOfFOsServed: { type: [String], default: [] }, 

  // NEW: Detailed Assets Structure
  assets: [{
    assetType: { type: String, enum: ['Physical Property', 'Fixed Deposit', 'LIC Policy', 'Government Bond'] },
    ownerName: { type: String, default: '' },
    ownerRelationship: { type: String, default: '' }, // NEW
    assetValue: { type: String, default: '' }, // Using String to accommodate different formats
    // Physical Property Details
    propertyType: { type: String, enum: ['House', 'Flat', 'Non-agricultural Land', 'Commercial Property'] },
    pendingLoan: { type: String, default: '' },
    locationPincode: { type: String, default: '' },
    documentsAvailable: { type: Boolean, default: false },
    authority: { type: String, enum: ['Gram Panchayat', 'Municipality', ''] },
    // Other asset details
    bankName: { type: String, default: '' }, // For FD
    policyType: { type: String, enum: ['Term', 'Life', ''] }, // For LIC
  }],

  // 5. Family Info / Co-Applicant (Flattened and Embedded)
  fatherName: { type: String },
  fatherEmploymentType: { type: String },
  // NEW: Add relations array to store co-applicants/guarantors
  relations: { type: [CoApplicantSchema], default: [] },

  fatherAnnualIncome: { type: Number },
  fatherPhoneNumber: { type: String },
  currentObligations: { type: String },
  cibilScore: { type: String },
  cibilIssues: { type: String },
  ownHouseGuarantor: {
    name: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    relationshipType: { type: String, default: '' },
    employmentType: { type: String, default: '' },
    annualIncome: { type: String, default: '' },
    currentObligations: { type: String, default: '' },
    cibilScore: { type: String, default: '' },
    hasCibilIssues: { type: Boolean, default: false },
    cibilIssues: { type: String, default: '' },
  },
  coApplicant: { type: CoApplicantSchema, default: {} },

  // 6. References (Array of Embedded Documents)
  references: { type: [ReferenceSchema], default: () => [
    { relationship: '', name: '', address: '', phoneNumber: '' },
    { relationship: '', name: '', address: '', phoneNumber: '' }
  ] },

  // 7. Other Info
  panStatus: { type: String, enum: ['Not Interested', 'Not Available', 'Applied', 'Available'], default: 'Applied' },
  panNumber: { type: String },
  referralList: { type: [ReferralListItemSchema], default: [] },
  collateralLocation: { type: String },
  suggestedBank: { type: String },
  
  // Reminder and Call History Fields
  lastCallDate: { type: Date }, // Will be updated every time a note is logged
  reminderCallDate: { type: Date }, // Primary field used for list view sorting
  reminders: [{
    date: { type: Date, required: true },
    done: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'No status' }
  }],
  leadStatus: { type: String, enum: ['No status', 'Sanctioned', 'Close', 'In Progress', 'New', 'On Priority', 'Application Incomplete'], default: 'New' },
  priorityReason: { type: String }, // NEW: Reason for being a priority
  closeReason: { type: String }, // NEW: Reason for closing the lead
  targetSanctionDate: { type: Date }, // This field will store the future target date

  // NEW: Embedded Call History
  callHistory: {
      type: [EmbeddedCallNoteSchema],
      default: []
  },
  // NEW: External notes from Bank Executives
  externalCallHistory: {
      type: [EmbeddedCallNoteSchema],
      default: []
  },
  // NEW: Array to track assignments to banks
  assignedBanks: { type: [BankAssignmentSchema], default: [] },

  // NEW: Array to store uploaded documents
  documents: { type: [DocumentSchema], default: [] }

}, { timestamps: true }); 

module.exports = mongoose.model('Lead', LeadSchema);