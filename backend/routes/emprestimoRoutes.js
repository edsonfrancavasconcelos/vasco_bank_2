import express from 'express';
const router = express.Router();

// Importa com o mesmo nome do controller
import { simularEmprestimo } from '../controllers/emprestimoController.js';

// Rota POST para simular empréstimo
router.post('/simular', simularEmprestimo);

export default router;
