const mongoose = require('mongoose');

// --- 1. Embedded Sub-Schemas (Unchanged) ---

// TestScores Sub-Schema
const TestScoresSchema = new mongoose.Schema({
  GRE: { type: String, default: "" },
  IELTS: { type: String, default: "" },
  TOEFL: { type: String, default: "" },
  GMAT: { type: String, default: "" },
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
  knowsCoApplicant: { type: Boolean, default: true },
}, { _id: false });

// ReferralListItem Sub-Schema
const ReferralListItemSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    code: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
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
        enum: ['Connected', 'Not Reached', 'Busy', 'Scheduled'],
        default: 'Connected' 
    },
    nextCallDate: { type: Date }, // Optional reminder date set during the call
}, { timestamps: true }); // Tracks when the note was created

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
  source: { type: SourceSchema, required: true }, // MADE REQUIRED for initial capture
  
  // Assignee Information 
  assignedFOId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedFO: { type: String },
  assignedFOPhone: { type: String },
  studentAppliedDate: { type: Date, default: Date.now },
  studentAppliedTime: { type: String },

  // 2. Education / Loan Info
  loanId: { type: String },
  loanType: { type: String },
  courseStartMonth: { type: String },
  courseStartYear: { type: String },
  degree: { type: String },
  fieldOfInterest: { type: String },
  interestedCountries: { type: String },
  admitReceived: { type: Boolean, default: false },
  admittedUniversities: { type: String },
  approachedAnyBank: { type: Boolean, default: false },
  previousBankApproached: { type: String },

  // 3. Test Scores (Embedded Document)
  testScores: { type: TestScoresSchema, default: {} },

  // 4. Financial Info
  age: { type: Number },
  workExperience: { type: String },
  hasLoans: { type: Boolean, default: false },
  courseDuration: { type: String },
  fee: { type: Number },
  living: { type: Number },
  otherExpenses: { type: Number },
  maxUnsecuredGivenByUBI: { type: Number },
  hasAssets: { type: Boolean, default: false },
  availableAssets: { type: String },
  listOfFOsServed: { type: [String], default: [] }, 

  // 5. Family Info / Co-Applicant (Flattened and Embedded)
  fatherName: { type: String },
  fatherEmploymentType: { type: String },
  fatherAnnualIncome: { type: Number },
  fatherPhoneNumber: { type: String },
  currentObligations: { type: String },
  cibilScore: { type: String },
  cibilIssues: { type: String },
  ownHouseGuarantor: { type: Boolean, default: false },
  coApplicant: { type: CoApplicantSchema, default: {} },

  // 6. References (Array of Embedded Documents)
  references: { type: [ReferenceSchema], default: [{ relationship: "Reference" }, { relationship: "Reference 2" }] },

  // 7. Other Info
  panStatus: { type: String, enum: ['Not Interested', 'Not Available', 'Applied', 'Available'], default: 'Not Interested' },
  panNumber: { type: String },
  referralList: { type: [ReferralListItemSchema], default: [] },
  collateralLocation: { type: String },
  suggestedBank: { type: String },
  
  // Reminder and Call History Fields
  lastCallDate: { type: Date }, // Will be updated every time a note is logged
  reminderCallDate: { type: Date }, // Primary field used for list view sorting
  leadStatus: { type: String, enum: ['No status', 'Sanctioned', 'Rejected', 'In Progress', 'New'], default: 'New' },
  targetSanctionDate: { type: Date },

  // NEW: Embedded Call History
  callHistory: {
      type: [EmbeddedCallNoteSchema],
      default: []
  }

}, { timestamps: true }); 

module.exports = mongoose.model('Lead', LeadSchema);