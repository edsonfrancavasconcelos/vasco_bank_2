// backend/routes/pixRoutes.js
import express from 'express';
const router = express.Router();

import pixController from '../controllers/pixController.js';
import { protect } from '../middleware/authMiddleware.js';

console.log("pixController carregado em pixRoutes.js:", pixController);

// Rotas Pix
router.post('/enviar', protect, pixController.enviarPix);
router.post('/cobrar', protect, pixController.cobrarPix);
router.post('/agendar', protect, pixController.agendarPix);
router.post('/chave/criar', protect, pixController.criarChavePix);
router.get('/chaves', protect, pixController.listarChavesPix);
router.delete('/chave/deletar', protect, pixController.deletarChave);

export default router;
