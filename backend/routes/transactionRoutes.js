// backend/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, transactionController.getTransactions);
router.post('/', authenticate, transactionController.createTransaction);

module.exports = router;
