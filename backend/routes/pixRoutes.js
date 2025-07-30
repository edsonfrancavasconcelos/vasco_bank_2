const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getPixKeys,
  createPixKey,
  deletePixKey,
  sendPix,
  receivePix
} = require('../controllers/pixController');

router.get('/keys', auth, getPixKeys);
router.post('/keys', auth, createPixKey);
router.delete('/keys/:id', auth, deletePixKey);
router.post('/send', auth, sendPix);
router.post('/receive', auth, receivePix);

module.exports = router;
