const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  listInvestments,
  applyInvestment,
  redeemInvestment
} = require('../controllers/investmentController');

router.get('/', auth, listInvestments);
router.post('/apply', auth, applyInvestment);
router.post('/redeem', auth, redeemInvestment);

module.exports = router;
