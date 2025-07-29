const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Alterado para bcryptjs
const sanitizeHtml = require('sanitize-html');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, cpf, rg, address, phone, initialBalance } = req.body;
    console.log('Dados recebidos para registro:', { fullName, email, password: '[HIDDEN]', cpf, rg, address, phone, initialBalance });

    if (!fullName || !email || !password || !cpf || !rg || !address) {
      console.log('Campos obrigatórios faltando:', { fullName, email, password, cpf, rg, address });
      return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email já cadastrado:', email);
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const accountNumber = String(crypto.randomInt(10000000, 99999999));

    const newUser = new User({
      fullName,
      email,
      password, // Será hasheado no pre('save')
      cpf,
      rg,
      address,
      accountNumber,
      balance: initialBalance || 0,
    });

    await newUser.save();
    console.log('Usuário salvo:', { email, accountNumber });

    const token = jwt.sign(
      { id: newUser._id, accountNumber: newUser.accountNumber },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        accountNumber: newUser.accountNumber,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error, error.stack);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Recebido login:', { email, password: '[HIDDEN]' });
    if (!email || !password) {
      console.log('Campos faltando:', { email, password });
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email });
    console.log('Usuário encontrado:', user ? { email: user.email, fullName: user.fullName } : null);
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    console.log('Hash armazenado:', user.password);
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Resultado comparePassword:', passwordMatch);
    if (!passwordMatch) {
      console.log('Senha incorreta para usuário:', email);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user._id, accountNumber: user.accountNumber },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.log('Token gerado:', token);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountNumber: user.accountNumber,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error, error.stack);
    res.status(500).json({ error: 'Erro no login' });
  }
};

const getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetToken -resetTokenExpires');
    if (!user) {
      console.log('Usuário não encontrado:', req.user.id);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error, error.stack);
    res.status(500).json({ error: 'Erro ao buscar informações do usuário' });
  }
};

const getUserByAccountNumber = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const user = await User.findOne({ accountNumber }).select('-password -resetToken -resetTokenExpires');
    if (!user) {
      console.log('Usuário não encontrado para accountNumber:', accountNumber);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário por número da conta:', error, error.stack);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar histórico de transações:', error, error.stack);
    res.status(500).json({ error: 'Erro ao buscar histórico de transações' });
  }
};

const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Cabeçalho de autorização inválido');
    return res.status(401).json({ error: 'Usuário não autenticado ou token inválido' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, accountNumber: decoded.accountNumber };
    next();
  } catch (error) {
    console.error('Token inválido:', error, error.stack);
    return res.status(401).json({ error: 'Usuário não autenticado ou token inválido' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log('Tentativa de reset de senha', { token, newPassword: '[HIDDEN]' });

    if (!token || !newPassword) {
      console.log('Campos faltando:', { token, newPassword });
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log('Token inválido ou expirado');
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const sanitizedPassword = sanitizeHtml(newPassword);
    if (sanitizedPassword.length < 6) {
      console.log('Senha muito curta:', sanitizedPassword.length);
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    user.password = await bcrypt.hash(sanitizedPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();
    console.log('Senha redefinida com sucesso para:', user.email);

    res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error, error.stack);
    res.status(500).json({ error: 'Erro ao redefinir senha, tente novamente mais tarde.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserInfo,
  getUserByAccountNumber,
  getTransactionHistory,
  checkAuth,
  resetPassword,
};