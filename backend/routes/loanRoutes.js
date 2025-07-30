const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  listLoans,
  requestLoan,
  payLoan
} = require('../controllers/loanController');

router.get('/', auth, listLoans);
router.post('/request', auth, requestLoan);
router.post('/pay', auth, payLoan);

module.exports = router;
