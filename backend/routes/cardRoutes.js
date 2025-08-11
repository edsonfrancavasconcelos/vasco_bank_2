// backend/routes/cardRoutes.js
const express = require('express');
const router = express.Router();
const {
  criarCartaoFisico,
  criarCartaoVirtual,
  excluirCartaoVirtual,
  listarCartoes,
  pedirNovoCartao,
} = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');

// Rotas corrigidas
router.post('/fisico', protect, criarCartaoFisico); // Cartão físico
router.post('/virtual', protect, criarCartaoVirtual); // Cartão virtual
router.delete('/virtual/:id', protect, excluirCartaoVirtual); // Excluir virtual
router.get('/meus-cartoes', protect, listarCartoes); // Ver meus cartões (corrigido para /meus-cartoes)
router.post('/novo', protect, pedirNovoCartao); // Pedir novo cartão (corrigido para /novo)

module.exports = router;