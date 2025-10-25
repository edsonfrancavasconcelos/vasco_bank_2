// backend/routes/cardRoutes.js
import express from 'express';
const router = express.Router();

import {
  criarCartaoFisico,
  criarCartaoVirtual,
  excluirCartaoVirtual,
  listarCartoes,
  pedirNovoCartao,
} from '../controllers/cardController.js';

import { protect } from '../middleware/authMiddleware.js';

// Rotas corrigidas
router.post('/fisico', protect, criarCartaoFisico);        // Cartão físico
router.post('/virtual', protect, criarCartaoVirtual);      // Cartão virtual
router.delete('/virtual/:id', protect, excluirCartaoVirtual); // Excluir virtual
router.get('/meus-cartoes', protect, listarCartoes);       // Ver meus cartões
router.post('/novo', protect, pedirNovoCartao);            // Pedir novo cartão

export default router;
