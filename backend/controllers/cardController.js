// backend/controllers/cardController.js
const Card = require('../models/Card');
const User = require('../models/User');
const PedidoCartao = require('../models/PedidoCartao');

exports.criarCartaoFisico = async (req, res) => {
  try {
    console.log('Iniciando criarCartaoFisico - req.body:', req.body);
    console.log('req.user:', req.user);

    const userId = req.user._id;
    if (!userId) {
      console.log('Usuário não autenticado: req.user._id não encontrado');
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const user = await User.findById(userId);
    console.log('Usuário encontrado:', user);
    if (!user) {
      console.log('Usuário não encontrado para ID:', userId);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { nomeTitular } = req.body;
    if (!nomeTitular) {
      console.log('Nome do titular não fornecido');
      return res.status(400).json({ error: 'Nome do titular é obrigatório' });
    }

    const cartaoExistente = await Card.findOne({ emailUsuario: user.email, tipo: 'fisico' });
    console.log('Cartão físico existente:', cartaoExistente);
    if (cartaoExistente) {
      console.log('Usuário já possui cartão físico:', user.email);
      return res.status(400).json({ error: 'Usuário já possui um cartão físico' });
    }

    const novoCartao = new Card({
      tipo: 'fisico',
      emailUsuario: user.email,
      nomeTitular,
      criadoEm: new Date(),
    });

    console.log('Novo cartão a ser salvo:', novoCartao);
    await novoCartao.save();
    console.log('Cartão salvo com sucesso:', novoCartao);

    res.status(201).json({ message: 'Cartão físico criado com sucesso', card: novoCartao });
  } catch (error) {
    console.error('Erro ao criar cartão físico:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao criar cartão físico', details: error.message });
  }
};

exports.criarCartaoVirtual = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { numero, cvv, validade, nomeTitular } = req.body;
    if (!numero || !cvv || !validade || !nomeTitular) {
      return res.status(400).json({ error: 'Nome do titular, número, CVV e validade são obrigatórios' });
    }

    const novoCartao = new Card({
      tipo: 'virtual',
      emailUsuario: user.email,
      numero,
      cvv,
      validade,
      nomeTitular,
      criadoEm: new Date(),
    });

    await novoCartao.save();
    res.status(201).json({ message: 'Cartão virtual criado com sucesso', card: novoCartao });
  } catch (error) {
    console.error('Erro ao criar cartão virtual:', error);
    res.status(500).json({ error: 'Erro ao criar cartão virtual' });
  }
};

exports.excluirCartaoVirtual = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

    const { id } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const cartao = await Card.findOneAndDelete({
      _id: id,
      emailUsuario: user.email,
      tipo: 'virtual',
    });

    if (!cartao) {
      return res.status(404).json({ error: 'Cartão virtual não encontrado' });
    }

    res.json({ message: 'Cartão virtual excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cartão virtual:', error);
    res.status(500).json({ error: 'Erro ao excluir cartão virtual' });
  }
};

exports.listarCartoes = async (req, res) => {
  try {
    const emailUsuario = req.user.email;
    console.log('Listando cartões para email:', emailUsuario);

    const cartoes = await Card.find({ emailUsuario }).sort({ criadoEm: -1 });
    const user = await User.findOne({ email: emailUsuario }).select('nome');

    const cartoesComNome = cartoes.map((c) => ({
      ...c.toObject(),
      nomeUsuario: user ? user.nome : 'Usuário desconhecido',
    }));

    console.log('Cartões encontrados com nome:', cartoesComNome);
    res.json(cartoesComNome);
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    res.status(500).json({ error: 'Erro ao listar cartões' });
  }
};

exports.pedirNovoCartao = async (req, res) => {
  try {
    console.log('Iniciando pedirNovoCartao - req.body:', req.body);
    console.log('req.user:', req.user);

    const userId = req.user?._id;
    if (!userId) {
      console.log('Usuário não autenticado: req.user._id não encontrado');
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const user = await User.findById(userId);
    console.log('Usuário encontrado:', user);
    if (!user) {
      console.log('Usuário não encontrado para ID:', userId);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { motivo } = req.body;
    if (!motivo) {
      console.log('Motivo não fornecido');
      return res.status(400).json({ error: 'Motivo é obrigatório' });
    }

    const novoPedido = new PedidoCartao({
      userId,
      motivo,
    });

    console.log('Novo pedido a ser salvo:', novoPedido);
    await novoPedido.save();
    console.log('Pedido salvo com sucesso:', novoPedido);

    res.status(201).json({ message: 'Pedido de novo cartão salvo com sucesso', pedido: novoPedido });
  } catch (error) {
    console.error('Erro ao salvar pedido de cartão:', error.message, error.stack);
    res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
};

module.exports = {
  criarCartaoFisico: exports.criarCartaoFisico,
  criarCartaoVirtual: exports.criarCartaoVirtual,
  excluirCartaoVirtual: exports.excluirCartaoVirtual,
  listarCartoes: exports.listarCartoes,
  pedirNovoCartao: exports.pedirNovoCartao,
};