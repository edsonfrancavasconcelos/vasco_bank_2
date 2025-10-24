// ------------------- Imports -------------------
import Card from '../models/Card.js';
import User from '../models/Usuario.js';
import PedidoCartao from '../models/PedidoCartao.js';

// ------------------- Cartões -------------------
export const criarCartaoFisico = async (req, res) => {
  try {
    console.log('Iniciando criarCartaoFisico - req.body:', JSON.stringify(req.body, null, 2));
    console.log('req.user:', JSON.stringify(req.user, null, 2));

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const { nomeTitular } = req.body;
    if (!nomeTitular) return res.status(400).json({ success: false, error: 'Nome do titular é obrigatório' });

    const cartaoExistente = await Card.findOne({ emailUsuario: user.email, tipo: 'fisico' });
    if (cartaoExistente) return res.status(400).json({ success: false, error: 'Usuário já possui um cartão físico' });

    const novoCartao = new Card({
      tipo: 'fisico',
      emailUsuario: user.email,
      nomeTitular,
      criadoEm: new Date(),
    });

    await novoCartao.save();
    res.status(201).json({ success: true, message: 'Cartão físico criado com sucesso', card: novoCartao });
  } catch (error) {
    console.error('Erro ao criar cartão físico:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar cartão físico', details: error.message });
  }
};

export const criarCartaoVirtual = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const { numero, cvv, validade } = req.body;
    if (!numero || !cvv || !validade) {
      return res.status(400).json({ success: false, error: 'Número, CVV e validade são obrigatórios' });
    }

    const nomeTitular = user.nome || 'Titular Padrão';

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

    res.status(201).json({
      success: true,
      message: 'Cartão virtual criado com sucesso',
      card: {
        _id: novoCartao._id,
        tipo: novoCartao.tipo,
        emailUsuario: novoCartao.emailUsuario,
        nomeTitular: novoCartao.nomeTitular,
        numero: novoCartao.numero,
        cvv: novoCartao.cvv,
        validade: novoCartao.validade,
        criadoEm: novoCartao.criadoEm,
      },
    });
  } catch (error) {
    console.error('Erro ao criar cartão virtual:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar cartão virtual', details: error.message });
  }
};

export const excluirCartaoVirtual = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });

    const { id } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const cartao = await Card.findOneAndDelete({ _id: id, emailUsuario: user.email, tipo: 'virtual' });
    if (!cartao) return res.status(404).json({ success: false, error: 'Cartão virtual não encontrado' });

    res.json({ success: true, message: 'Cartão virtual excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cartão virtual:', error);
    res.status(500).json({ success: false, error: 'Erro ao excluir cartão virtual', details: error.message });
  }
};

export const listarCartoes = async (req, res) => {
  try {
    const emailUsuario = req.user.email;
    const cartoes = await Card.find({ emailUsuario }).sort({ criadoEm: -1 });
    const user = await User.findOne({ email: emailUsuario }).select('nome');

    const cartoesComNome = cartoes.map(c => ({
      ...c.toObject(),
      nomeUsuario: user ? user.nome : 'Usuário desconhecido',
    }));

    res.json(cartoesComNome);
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar cartões', details: error.message });
  }
};

export const pedirNovoCartao = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ success: false, error: 'Motivo é obrigatório' });

    const novoPedido = new PedidoCartao({
      userId,
      motivo,
      criadoEm: new Date(),
    });

    await novoPedido.save();
    res.status(201).json({ success: true, message: 'Pedido de novo cartão salvo com sucesso', pedido: novoPedido });
  } catch (error) {
    console.error('Erro ao salvar pedido de cartão:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor', details: error.message });
  }
};
