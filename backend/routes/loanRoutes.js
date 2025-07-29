// backend/routes/loans.js
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const authMiddleware = require('../middleware/auth');

router.post('/request', authMiddleware, loanController.createLoan);
router.post('/financing/property', authMiddleware, loanController.financeProperty);
router.post('/financing/vehicle', authMiddleware, loanController.financeVehicle);
router.post('/financing/personal', authMiddleware, loanController.financePersonal);
router.get('/user', authMiddleware, loanController.getUserLoans);

module.exports = router;