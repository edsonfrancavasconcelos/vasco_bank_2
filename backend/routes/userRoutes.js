const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt'); // Adicionado
const {
  registerUser,
  loginUser,
  getUserInfo,
  getUserByAccountNumber,
  checkAuth,
} = require('../controllers/userController');
const auth = require('../middleware/auth');

console.log('Inicializando userRoutes');

// Registrar usuário
router.post('/', (req, res, next) => {
  console.log('Recebido POST /api/users:', { body: { ...req.body, password: '[HIDDEN]' } });
  registerUser(req, res, next);
});

// Registrar usuário (mantido para compatibilidade)
router.post('/register', (req, res, next) => {
  console.log('Recebido POST /api/users/register:', { body: { ...req.body, password: '[HIDDEN]' } });
  registerUser(req, res, next);
});

// Login
router.post('/login', loginUser);

// Recuperar senha
router.post('/recover', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado para recuperação:', email);
      return res.status(404).json({ error: 'Usuário não encontrado com esse email.' });
    }
    console.log(`Instruções de recuperação enviadas para: ${email}`);
    return res.json({ message: 'Instruções de recuperação enviadas para o email.' });
  } catch (error) {
    console.error('Erro ao tentar recuperar acesso:', error, error.stack);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Obter informações do usuário
router.get('/info', auth, getUserInfo);

// Obter usuário por número da conta
router.get('/account/:accountNumber', auth, getUserByAccountNumber);

// Verificar autenticação
router.get('/check', auth, checkAuth);

// Buscar usuário por CPF ou número da conta
router.get('/search', auth, async (req, res) => {
  try {
    const { identifier } = req.query;
    if (!identifier) {
      console.log('Identificador não fornecido');
      return res.status(400).json({ error: 'CPF ou número da conta é obrigatório' });
    }
    const user = await User.findOne({
      $or: [{ cpf: identifier }, { accountNumber: identifier }],
    });
    if (!user) {
      console.log('Conta não encontrada para identifier:', identifier);
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    console.log('Usuário encontrado por busca:', { fullName: user.fullName, accountNumber: user.accountNumber });
    res.status(200).json({
      fullName: user.fullName,
      cpf: user.cpf,
      accountNumber: user.accountNumber,
    });
  } catch (error) {
    console.error('Erro ao buscar conta:', error, error.stack);
    res.status(500).json({ error: 'Erro ao buscar conta' });
  }
});

// Obter dados do usuário autenticado
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Acessando rota /api/users/me, userId:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('Usuário não encontrado:', req.user.id);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    console.log('Dados do usuário enviados:', {
      fullName: user.fullName,
      accountNumber: user.accountNumber,
      balance: user.balance,
    });
    res.json({
      fullName: user.fullName,
      accountNumber: user.accountNumber,
      balance: user.balance,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error, error.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint temporário para testar a senha
router.get('/test-password', async (req, res) => {
  try {
    const { email, password } = req.query;
    console.log('Testando senha para:', { email, password: '[HIDDEN]' });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Hash armazenado:', user.password);
    console.log('Resultado comparePassword:', passwordMatch);
    res.json({ email, hash: user.password, passwordMatch });
  } catch (error) {
    console.error('Erro ao testar senha:', error, error.stack);
    res.status(500).json({ error: 'Erro ao testar senha' });
  }
});

module.exports = router;