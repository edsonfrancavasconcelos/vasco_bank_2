// /backend/routes/historicoRoutes.js

import express from 'express';
import { obterHistoricoUsuario, obterHistoricoCredito } from '../controllers/historicoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/user/me/historico', protect, obterHistoricoUsuario);
router.get('/user/me/historico/credito', protect, obterHistoricoCredito);

export default router;
