require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const gerarNumeroContaUnico = require('../utils/gerarNumeroConta');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_segura';

// === LOGIN ===
const loginUser = async (req, res) => { 
  console.log('[LOGIN] Dados recebidos:', req.body);
  console.log('Estado da conexão mongoose:', mongoose.connection.readyState);
  try {
    const { email, senha } = req.body;
    console.log('[LOGIN] Dados recebidos:', { email, senha });

    if (!email || !senha) {
      console.warn('[LOGIN] Campos obrigatórios ausentes');
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.warn('[LOGIN] Usuário não encontrado:', email);
      return res.status(401).json({ message: 'Credenciais inválidas (usuário não encontrado)' });
    }

    console.log('[LOGIN] Comparando senha...');
    const senhaCorreta = await bcrypt.compare(senha, user.senha);
    console.log('[LOGIN] Senha enviada:', senha);
    console.log('[LOGIN] Hash no banco:', user.senha);
    console.log('[LOGIN] Senha correta?', senhaCorreta);

    if (!senhaCorreta) {
      console.warn('[LOGIN] Senha incorreta');
      return res.status(401).json({ message: 'Credenciais inválidas (senha incorreta)' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    console.log('[LOGIN] Login bem-sucedido:', user.email);
    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nome: user.nome,
        numeroConta: user.numeroConta,
      },
    });
  } catch (error) {
    console.error('[LOGIN] Erro inesperado:', error.message, error.stack);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

// === REGISTRO ===
const registerUser = async (req, res) => {
  try {
    const { nome, email, cpf, telefone, endereco, senha } = req.body;
    console.log('[REGISTRO] Dados recebidos:', { nome, email, cpf, telefone, endereco });

    if (!nome || !email || !cpf || !telefone || !endereco || !senha) {
      console.warn('[REGISTRO] Campos obrigatórios ausentes');
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const usuarioExistente = await User.findOne({
      $or: [{ email: normalizedEmail }, { cpf: cpf.trim() }],
    });

    if (usuarioExistente) {
      console.warn('[REGISTRO] Email ou CPF já cadastrado:', normalizedEmail);
      return res.status(409).json({ error: 'Email ou CPF já cadastrado.' });
    }

    const senhaCriptografada = await bcrypt.hash(senha.trim(), 10);
    console.log('[REGISTRO] Hash gerado:', senhaCriptografada);

    const numeroConta = await gerarNumeroContaUnico();
    console.log('[REGISTRO] Número de conta gerado:', numeroConta);

    const novoUsuario = new User({
      nome: nome.trim(),
      email: normalizedEmail,
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      endereco: endereco.trim(),
      senha: senhaCriptografada, // Corrigido: usar o hash
      numeroConta,
      saldo: 0,
      fatura: 0,
      historicoFatura: [],
      historicoSaldo: [],
    });

    await novoUsuario.save();
    console.log('[REGISTRO] Usuário criado:', { id: novoUsuario._id, email: novoUsuario.email });

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      numeroConta: novoUsuario.numeroConta,
    });
  } catch (error) {
    console.error('[REGISTRO] Erro inesperado:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

// === RESET DE SENHA ===
const resetSenha = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('[RESET] Email recebido:', email);

    if (!email) {
      console.warn('[RESET] Email não fornecido');
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.warn('[RESET] Usuário não encontrado:', normalizedEmail);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const novaSenha = '123456'; // Idealmente: gerar uma senha aleatória e enviar por e-mail
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    user.senha = senhaCriptografada;
    await user.save();
    console.log('[RESET] Senha resetada para:', normalizedEmail);

    res.status(200).json({ message: `Senha resetada para '${novaSenha}'. Use-a para logar.` });
  } catch (error) {
    console.error('[RESET] Erro inesperado:', error.message, error.stack);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

module.exports = {
  loginUser,
  registerUser,
  resetSenha,
};