// userRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');


const { registerUser, loginUser, resetSenha } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Corrigido: agora importando corretamente

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_segura';

// Rotas públicas (não exigem autenticação)
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/reset', resetSenha);
router.post('/logout', (req, res) => {
  // No caso do JWT, apenas informamos que o logout foi bem-sucedido
  res.json({ message: 'Logout realizado com sucesso' });
});


// Rotas protegidas (exigem token JWT)
router.get('/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;

    if (String(req.userId) !== String(userId)) {
      console.log('Acesso negado: ID do token não corresponde', { userId, tokenUserId: req.userId });
      return res.status(403).json({ error: 'Acesso negado: você só pode acessar seus próprios dados.' });
    }

    const user = await User.findById(userId).select('nome numeroConta saldo fatura');
    if (!user) {
      console.log('Usuário não encontrado:', userId);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar dados do usuário:', err.message);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
  }
});

router.get('/:id/fatura', protect, async (req, res) => {
  try {
    const userId = req.params.id;

    if (String(req.userId) !== String(userId)) {
      console.log('Acesso negado: ID do token não corresponde', { userId, tokenUserId: req.userId });
      return res.status(403).json({ error: 'Acesso negado: você só pode acessar seus próprios dados.' });
    }

    const user = await User.findById(userId).select('historicoFatura');
    if (!user) {
      console.log('Usuário não encontrado:', userId);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(user.historicoFatura);
  } catch (err) {
    console.error('Erro ao buscar histórico da fatura:', err.message);
    res.status(500).json({ error: 'Erro ao buscar histórico da fatura.' });
  }
});

router.get('/:id/saldo', protect, async (req, res) => {
  try {
    const userId = req.params.id;

    if (String(req.userId) !== String(userId)) {
      console.log('Acesso negado: ID do token não corresponde', { userId, tokenUserId: req.userId });
      return res.status(403).json({ error: 'Acesso negado: você só pode acessar seus próprios dados.' });
    }

    const user = await User.findById(userId).select('historicoSaldo');
    if (!user) {
      console.log('Usuário não encontrado:', userId);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(user.historicoSaldo);
  } catch (err) {
    console.error('Erro ao buscar histórico do saldo:', err.message);
    res.status(500).json({ error: 'Erro ao buscar histórico do saldo.' });
  }
});

module.exports = router;
