const express = require('express');
const router = express.Router();

const {
  getChavesPix,
  criarChavePix,
  getHistoricoPix,
  enviarPix,
  receberPix,
  cobrarPix,
  agendarPix,
  getMinhasChavesPix,
  excluirChavePix,
  lerQRCode,
} = require('../controllers/pixController');

const { protect } = require('../middleware/authMiddleware');

// Aplica o middleware de autenticação a todas as rotas
router.use(protect);

// Definição das rotas
router.get('/chaves', getChavesPix);
router.post('/chaves', criarChavePix);
router.get('/historico', getHistoricoPix);
router.post('/enviar', enviarPix);
router.post('/receber', receberPix); // Usa a função receberPix do controlador
router.post('/agendar', agendarPix);
router.post('/cobrar', cobrarPix);
router.get('/minhas-chaves', getMinhasChavesPix);
router.delete('/chaves/:id', excluirChavePix)
router.post('/ler-qrcode', lerQRCode);

module.exports = router;