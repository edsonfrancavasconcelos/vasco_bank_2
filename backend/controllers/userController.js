import 'dotenv/config';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Transaction from '../models/Transaction.js';
import gerarNumeroContaUnico from '../utils/gerarNumeroConta.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_segura';

// ============================
// LOGIN
// ============================
export const loginUser = async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await Usuario.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const senhaCorreta = await user.comparePassword(senha);
    if (!senhaCorreta) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    console.log('[LOGIN] Usuário logado:', user._id, user.email);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nome: user.nome,
        numeroConta: user.numeroConta,
        saldo: user.saldo || 0,
        faturaAtual: user.faturaAtual || 0,
        creditoUsado: user.creditoUsado || 0
      }
    });
  } catch (error) {
    console.error('[LOGIN] Erro inesperado:', error.message, error.stack);
    return res.status(500).json({ message: 'Erro ao fazer login.' });
  }
};

// ============================
// DASHBOARD
// ============================
export const getDashboard = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-senha');
    if (!usuario) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado." });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        numeroConta: usuario.numeroConta,
        saldo: usuario.saldo || 0,
        creditoUsado: usuario.creditoUsado || 0
      }
    });
  } catch (err) {
    console.error("[DASHBOARD] Erro:", err.message);
    return res.status(500).json({ success: false, error: "Erro ao carregar dashboard." });
  }
};

// ============================
// REGISTRO
// ============================
export const registerUser = async (req, res) => {
  try {
    const { nome, email, cpf, telefone, endereco, senha, saldo } = req.body;
    if (!nome || !email || !cpf || !telefone || !endereco || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCpf = cpf.trim();

    const usuarioExistente = await Usuario.findOne({
      $or: [{ email: normalizedEmail }, { cpf: normalizedCpf }]
    });

    if (usuarioExistente) {
      return res.status(409).json({ error: 'Email ou CPF já cadastrado.' });
    }

    const numeroConta = await gerarNumeroContaUnico();

    const novoUsuario = new Usuario({
      nome: nome.trim(),
      email: normalizedEmail,
      cpf: normalizedCpf,
      telefone: telefone.trim(),
      endereco: endereco.trim(),
      senha: senha.trim(),
      numeroConta,
      saldo: Number(saldo) || 0,
      faturaAtual: 0,
      historicoFatura: [],
      historicoSaldo: [],
      transacoes: [],
    });

    await novoUsuario.save();

    console.log('[REGISTRO] Novo usuário:', novoUsuario._id, novoUsuario.email);

    return res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      numeroConta: novoUsuario.numeroConta,
      saldo: novoUsuario.saldo,
    });
  } catch (error) {
    console.error('[REGISTRO] Erro inesperado:', error.message, error.stack);
    return res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

// ============================
// RESET DE SENHA
// ============================
export const resetSenha = async (req, res) => {
  try {
    const { email, novaSenha } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório.' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await Usuario.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    user.senha = novaSenha?.trim() || '123456';
    await user.save();

    console.log('[RESET] Senha resetada para:', user.email);

    return res.status(200).json({ message: 'Senha resetada com sucesso. Use-a para logar.' });
  } catch (error) {
    console.error('[RESET] Erro inesperado:', error.message, error.stack);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

// ============================
// HISTÓRICO DE TRANSAÇÕES
// ============================
export const getHistorico = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.error('[HISTÓRICO] Usuário não autenticado.');
      return res.status(401).json({ success: false, error: 'Usuário não autenticado.' });
    }

    const { tipo } = req.query;

    const filtro = { $or: [{ usuario: userId }, { origemUsuario: userId }] };
    if (tipo && ['debito', 'credito'].includes(tipo.toLowerCase())) {
      filtro.tipoOperacao = tipo.toLowerCase();
    }

    const transacoes = await Transaction.find(filtro)
      .sort({ data: -1 })
      .populate('usuario', 'nome numeroConta')
      .populate('origemUsuario', 'nome numeroConta')
      .lean();

    console.log(`[HISTÓRICO] ${transacoes.length} transações encontradas para usuário ${userId}`);

    const historico = transacoes.map(tx => ({
      _id: tx._id,
      tipo: tx.tipoOperacao || 'desconhecido',
      valor: Number(tx.valor) || 0,
      descricao: tx.descricao || '',
      status: tx.status || 'concluído',
      data: tx.data || new Date(),
      contaDestino: tx.contaDestino || '',
      nomeRemetente: tx.origemUsuario?.nome || '',
      nomeRecebedor: tx.usuario?.nome || '',
      chave: tx.chave || '',
    }));

    return res.status(200).json({ success: true, data: historico });
  } catch (err) {
    console.error('[HISTÓRICO] Erro ao buscar histórico:', err.message);
    return res.status(500).json({ success: false, error: 'Erro ao carregar histórico.' });
  }
};
