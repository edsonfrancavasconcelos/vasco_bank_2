<<<<<<< HEAD
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { criarTransacao } from "../controllers/transactionController.js";

const router = express.Router();

router.post("/nova", protect, criarTransacao);
=======
// backend/routes/transactionRoutes.js
import express from 'express';
import {
  criarTransacao,
  listarTransacoesComNomes,
  listarFaturas,
  pagarFatura,        // caso queira adicionar pagamento via rota
  anteciparFatura,    // se for implementar antecipação
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// -------------------
// Middleware de autenticação
// -------------------
// Todas as rotas abaixo só podem ser acessadas por usuários autenticados
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
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

export default router;
