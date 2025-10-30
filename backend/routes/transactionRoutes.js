// backend/routes/transactionRoutes.js
import express from 'express';
import {
  criarTransacao,
  listarTransacoesComNomes,
  listarFaturas,
  pagarFatura,
  anteciparFatura,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// -------------------
// Middleware de autenticação
// -------------------
router.use(protect);

// -------------------
// Rotas de transações
// -------------------

// Criar nova transação (crédito, débito, pagamento, transferência, recarga, etc.)
router.post('/nova', criarTransacao);

// Listar histórico de transações do usuário
router.get('/historico', listarTransacoesComNomes);

// -------------------
// Rotas de fatura
// -------------------

// Listar faturas do usuário
router.get('/faturas', listarFaturas);

// Pagar fatura do usuário
router.post('/faturas/pagar', pagarFatura);

// Antecipar fatura (opcional)
router.post('/faturas/antecipar', anteciparFatura);

export default router;
