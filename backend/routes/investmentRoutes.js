// C:\Users\edson\OneDrive\Documents\Meus_Projetos\Vasco_bank_2\backend\routes\investmentRoutes.js
const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');

router.post('/', investmentController.createInvestment);
router.get('/', investmentController.getUserInvestments);

module.exports = router;