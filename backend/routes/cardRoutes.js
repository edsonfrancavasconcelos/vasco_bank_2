const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getCards,
  createVirtualCard,
  deleteCard,
  replaceCard,
  unlockCard
} = require('../controllers/cardController');

router.get('/', auth, getCards);
router.post('/virtual', auth, createVirtualCard);
router.delete('/:id', auth, deleteCard);
router.post('/:id/replace', auth, replaceCard);
router.post('/:id/unlock', auth, unlockCard);

module.exports = router;
