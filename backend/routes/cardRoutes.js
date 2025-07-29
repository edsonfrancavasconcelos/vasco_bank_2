// Arquivo: backend/routes/cardRoutes.js

const router = require('express').Router();
const {
  createCard,
  createVirtualCard,
  replacePhysicalCard,
  activateCard,
  unlockCard,
  getCards
} = require('../controllers/cardController');
const CardRequest = require('../models/CardRequest');
const auth = require('../middleware/auth');

// Buscar solicitações de cartão físico
router.get('/requests', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await CardRequest.find({ userId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Erro ao buscar solicitações de cartão físico:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitações' });
  }
});

// Buscar cartões físicos do usuário
router.get('/cards', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cardsFisicos = await Card.find({ userId, tipo: 'FISICO' });
    res.json(cardsFisicos);
  } catch (error) {
    console.error('Erro ao buscar cartões físicos:', error);
    res.status(500).json({ error: 'Erro ao buscar cartões físicos' });
  }
});

// Buscar todos os cartões do usuário
router.get('/', auth, getCards);

// Criar, substituir, ativar e desbloquear cartões
router.post('/create', auth, createCard);
router.post('/virtual', auth, createVirtualCard);
router.post('/replace', auth, replacePhysicalCard);
router.post('/activate', auth, activateCard);
router.post('/unlock', auth, unlockCard);

module.exports = router;