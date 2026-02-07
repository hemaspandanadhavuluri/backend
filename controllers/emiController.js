/**
 * EMI Calculator Controller
 * Handles EMI calculation requests with accurate moratorium handling
 */

// In-memory storage for saved calculations (for demo purposes; use database in production)
let savedCalculations = [];

/**
 * GET /api/emi/defaults - Get default values for EMI calculator
 */
exports.getDefaults = (req, res) => {
    try {
        const defaults = {
            courseMonths: 24,
            loanAmount: 500000,
            interest: 10,
            moratorium: 'No',
            graceMonths: 0,
            repayYears: 10
        };
        res.json(defaults);
    } catch (error) {
        console.error('Error fetching defaults:', error);
        res.status(500).json({
            message: 'Error fetching defaults',
            error: error.message
        });
    }
};

/**
 * POST /api/emi/save - Save an EMI calculation
 */
exports.saveCalculation = (req, res) => {
    const { loanAmount, interest, repayYears, courseMonths, moratorium, graceMonths, emi, totalPayment, totalInterest } = req.body;

    // Validate required fields
    if (!loanAmount || !interest || !repayYears || emi === undefined || totalPayment === undefined || totalInterest === undefined) {
        return res.status(400).json({
            message: 'All calculation parameters and results are required.'
        });
    }

    try {
        const calculation = {
            id: Date.now().toString(),
            loanAmount: parseFloat(loanAmount),
            interest: parseFloat(interest),
            repayYears: parseInt(repayYears),
            courseMonths: parseInt(courseMonths),
            moratorium,
            graceMonths: parseInt(graceMonths),
            emi: parseFloat(emi),
            totalPayment: parseFloat(totalPayment),
            totalInterest: parseFloat(totalInterest),
            savedAt: new Date().toISOString()
        };

        savedCalculations.push(calculation);

        res.json({
            message: 'Calculation saved successfully',
            id: calculation.id
        });
    } catch (error) {
        console.error('Error saving calculation:', error);
        res.status(500).json({
            message: 'Error saving calculation',
            error: error.message
        });
    }
};

/**
 * GET /api/emi/history - Get saved calculations (optional, for future use)
 */
exports.getHistory = (req, res) => {
    try {
        res.json(savedCalculations);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({
            message: 'Error fetching history',
            error: error.message
        });
    }
};

/**
 * POST /api/emi/calculate - Calculate EMI based on provided parameters
 */
// EMI CONTROLLER

/**
 * CALCULATE EMI
 */
// ================= EMI CALCULATION =================

const calculateEMI = (req, res) => {
    const { loanAmount, interest, repayYears, courseMonths, graceMonths, moratorium, psiAmount } = req.body;

    try {
        let P = parseFloat(loanAmount);
        let annualRate = parseFloat(interest) / 100;
        let monthlyRate = annualRate / 12;
        let repayMonths = parseInt(repayYears) * 12;

        // moratorium months
        let moratoriumMonths = (parseInt(courseMonths) || 0) + (parseInt(graceMonths) || 0);
        let moratoriumYears = moratoriumMonths / 12;

        let adjustedPrincipal = P;

        // SIMPLE INTEREST during moratorium
        let totalMoratoriumInterest = P * annualRate * moratoriumYears;

        if (moratorium === "No") {
            adjustedPrincipal = P + totalMoratoriumInterest;
        }

        else if (moratorium === "Yes,Full Simple Intrest") {
            adjustedPrincipal = P; // full interest paid
        }

        else if (moratorium === "Yes,Only Partial Intrest") {
            let psi = parseFloat(psiAmount) || 0;
            let totalPSI = psi * moratoriumMonths;

            let remainingInterest = totalMoratoriumInterest - totalPSI;
            if (remainingInterest < 0) remainingInterest = 0;

            adjustedPrincipal = P + remainingInterest;
        }

        else if (moratorium === "Yes,Full EMI From month 1") {
            adjustedPrincipal = P;
        }

        // EMI
        let emi =
            (adjustedPrincipal * monthlyRate * Math.pow(1 + monthlyRate, repayMonths)) /
            (Math.pow(1 + monthlyRate, repayMonths) - 1);

        let totalPayment = emi * repayMonths;
        let totalInterest = totalPayment - P;

        res.json({
            emi: Math.round(emi),
            totalPayment: Math.round(totalPayment),
            totalInterest: Math.round(totalInterest)
        });

    } catch (error) {
        res.status(500).json({
            message: "Calculation error",
            error: error.message
        });
    }
};


// ================= MAX PSI =================

const getMaxPSI = (req, res) => {
    const { loanAmount, interest } = req.body;

    try {
        let principal = parseFloat(loanAmount);
        let annualRate = parseFloat(interest);

        let monthlyRate = annualRate / 12 / 100;
        let maxPSI = principal * monthlyRate;

        res.json({
            maxPSI: Math.round(maxPSI)
        });

    } catch (error) {
        res.status(500).json({
            message: "Max PSI error",
            error: error.message
        });
    }
};


module.exports = {
    calculateEMI,
    getMaxPSI
};
