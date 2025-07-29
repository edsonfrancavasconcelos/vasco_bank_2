// ./routes/pixRoutes.js
const express = require('express');
const router = express.Router();
const {
  transferPix,
  payPix,
  chargePix,
  schedulePix,
  registerPixKey,
  getPixKeys, // Ensure this is included
  deletePixKey,
} = require('../controllers/pixController');
const auth = require('../middleware/auth');

router.post('/transfer', auth, transferPix);
router.post('/pay', auth, payPix);
router.post('/charge', auth, chargePix);
router.post('/schedule', auth, schedulePix);
router.post('/registerKey', auth, registerPixKey);
router.get('/myKeys', auth, getPixKeys);
router.delete('/keys/:id', auth, deletePixKey);

module.exports = router;