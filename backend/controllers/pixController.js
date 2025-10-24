// backend/controllers/pixController.js
import QRCode from 'qrcode';
import PixUsuario from '../models/PixUsuario.js';
import User from '../models/Usuario.js';
import Transaction from '../models/Transaction.js';
import crypto from 'crypto';

// ------------------- Helpers -------------------
function gerarChaveAleatoria() {
  return crypto.randomBytes(16).toString('hex');
}

async function gerarQRCode(chave, isCobranca, valor, descricao, txid) {
  try {
    let payload = `00020126360014BR.GOV.BCB.PIX0114${chave}`;
    if (isCobranca) {
      payload += `5204000053039865404${valor.toFixed(2)}5802BR5913${descricao || 'PAGAMENTO'}6009SAO PAULO62070503***6304${txid}`;
    } else {
      payload += `5204000053039865802BR5913${descricao || 'PAGAMENTO'}6009SAO PAULO62070503***6304${txid}`;
    }
    const qrcode = await QRCode.toDataURL(payload);
    return { payload, qrcode };
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err);
    throw new Error('Falha ao gerar QR Code');
  }
}

// ------------------- Controller -------------------
const pixController = {};

// ------------------- Enviar Pix -------------------
pixController.enviarPix = async (req, res) => {
  try {
    const { valor, chaveDestino, descricao } = req.body;
    if (!valor || !chaveDestino) throw new Error('Campos obrigatórios faltando');

    const chaveNormalizada = chaveDestino.trim().toLowerCase();
    const destinoPix = await PixUsuario.findOne({
      chaves: { $elemMatch: { valor: chaveNormalizada } },
    }).populate('usuario');

    if (!destinoPix) throw new Error('Chave Pix não encontrada');
    const usuarioRecebedor = destinoPix.usuario;
    if (!usuarioRecebedor) throw new Error('Usuário recebedor não encontrado');

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) throw new Error('Valor inválido');

    const usuarioOrigem = await User.findById(req.user.id);
    if (!usuarioOrigem) throw new Error('Usuário origem não encontrado');
    if (usuarioOrigem.saldo < valorNum) throw new Error('Saldo insuficiente');

    usuarioOrigem.saldo -= valorNum;
    usuarioRecebedor.saldo += valorNum;
    await usuarioOrigem.save();
    await usuarioRecebedor.save();

    const txid = crypto.randomBytes(8).toString('hex');

    await Transaction.create({
      tipo: 'pix-enviar',
      usuario: usuarioOrigem._id,
      deUsuario: usuarioOrigem._id,
      paraUsuario: usuarioRecebedor._id,
      chave: chaveNormalizada,
      valor: -valorNum,
      descricao: `Pix para ${usuarioRecebedor.nome} - ${descricao || 'Sem descrição'}`,
      txid,
    });

    const { payload, qrcode } = await gerarQRCode(chaveNormalizada, false, valorNum, descricao || '', txid);

    res.status(200).json({
      success: true,
      data: {
        valor: valorNum,
        descricao,
        qr: qrcode,
        chave: chaveNormalizada,
        payload,
        txid,
        deUsuario: usuarioOrigem.nome,
        paraUsuario: usuarioRecebedor.nome
      }
    });
  } catch (err) {
    console.error('Erro em enviarPix:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ------------------- Cobrar Pix -------------------
pixController.cobrarPix = async (req, res) => {
  try {
    const { valor, chaveRecebedor, descricao } = req.body;
    if (!valor || !chaveRecebedor) throw new Error('Campos obrigatórios faltando');

    const chaveNormalizada = chaveRecebedor.trim().toLowerCase();
    const destinoPix = await PixUsuario.findOne({
      chaves: { $elemMatch: { valor: chaveNormalizada } },
    }).populate('usuario');

    if (!destinoPix) throw new Error('Chave Pix não encontrada');
    const usuarioRecebedor = destinoPix.usuario;
    if (!usuarioRecebedor) throw new Error('Usuário recebedor não encontrado');

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) throw new Error('Valor inválido');

    const txid = crypto.randomBytes(8).toString('hex');

    const tx = await Transaction.create({
      tipo: 'pix-cobrar',
      usuario: usuarioRecebedor._id,
      valor: valorNum,
      chave: chaveNormalizada,
      descricao: descricao || '',
      txid
    });

    const { payload, qrcode } = await gerarQRCode(chaveNormalizada, true, valorNum, descricao || '', txid);
    const codigoCobranca = 'PIX-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    res.status(200).json({
      success: true,
      data: { codigoCobranca, valor: valorNum, descricao, qr: qrcode, chave: chaveNormalizada, payload, tx }
    });
  } catch (err) {
    console.error('Erro em cobrarPix:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ------------------- Agendar Pix -------------------
pixController.agendarPix = async (req, res) => {
  try {
    const { valor, chaveDestino, descricao, dataAgendada } = req.body;
    if (!valor || !chaveDestino || !dataAgendada) throw new Error('Campos obrigatórios faltando');

    const chaveNormalizada = chaveDestino.trim().toLowerCase();
    const usuarioOrigem = await User.findById(req.user.id);
    if (!usuarioOrigem) throw new Error('Usuário origem não encontrado');

    const destinoPix = await PixUsuario.findOne({
      chaves: { $elemMatch: { valor: chaveNormalizada } },
    }).populate('usuario');

    if (!destinoPix) throw new Error('Chave Pix não encontrada');
    const usuarioDestino = destinoPix.usuario;
    if (!usuarioDestino) throw new Error('Usuário destino não encontrado');

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) throw new Error('Valor inválido');

    const tx = await Transaction.create({
      tipo: 'pix-agendado',
      usuario: usuarioOrigem._id,
      deUsuario: usuarioOrigem._id,
      contaDestino: usuarioDestino._id,
      chave: chaveNormalizada,
      valor: valorNum,
      descricao: descricao || '',
      data: new Date(dataAgendada),
      txid: crypto.randomBytes(8).toString('hex')
    });

    res.status(200).json({ success: true, data: tx });
  } catch (err) {
    console.error('Erro em agendarPix:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ------------------- Criar Chave Pix -------------------
pixController.criarChavePix = async (req, res) => {
  try {
    let { tipo, valor } = req.body;
    if (!tipo) throw new Error('Tipo de chave obrigatório');

    const user = await User.findById(req.user.id);
    if (!user) throw new Error('Usuário não encontrado');

    tipo = tipo.toLowerCase();
    if (tipo === 'celular') tipo = 'telefone';
    if (tipo === 'aleatória') tipo = 'aleatoria';

    let chaveValor;
    switch (tipo) {
      case 'aleatoria':
        chaveValor = gerarChaveAleatoria();
        break;
      case 'telefone':
        chaveValor = valor || `55${Math.floor(Math.random() * 900000000 + 100000000)}`;
        break;
      case 'cpf':
      case 'email':
        if (!valor) throw new Error(`Valor da chave ${tipo} obrigatório`);
        chaveValor = valor.trim().toLowerCase();
        break;
      default:
        throw new Error('Tipo de chave inválido');
    }

    let pixUsuario = await PixUsuario.findOne({ usuario: user._id });
    if (!pixUsuario) {
      pixUsuario = new PixUsuario({ usuario: user._id, chaves: [] });
    }

    if (pixUsuario.chaves.length >= 5) throw new Error('Limite de 5 chaves por usuário atingido.');
    if (pixUsuario.chaves.some((c) => c.valor === chaveValor)) {
      throw new Error('Chave já existe para este usuário');
    }

    const chaveExistente = await PixUsuario.findOne({
      chaves: { $elemMatch: { valor: chaveValor } },
    });
    if (chaveExistente && !chaveExistente.usuario.equals(user._id)) {
      throw new Error('Chave já registrada por outro usuário');
    }

    pixUsuario.chaves.push({ tipo, valor: chaveValor });
    await pixUsuario.save();

    const { payload, qrcode } = await gerarQRCode(chaveValor, false, 0, 'Chave Pix Criada', crypto.randomBytes(8).toString('hex'));

    res.status(200).json({ success: true, data: { tipo, valor: chaveValor, qr: qrcode, payload } });
  } catch (err) {
    console.error('Erro em criarChavePix:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ------------------- Listar Chaves Pix -------------------
pixController.listarChavesPix = async (req, res) => {
  try {
    const pixUsuario = await PixUsuario.findOne({ usuario: req.user.id });
    const chaves = pixUsuario ? pixUsuario.chaves : [];
    res.status(200).json({ success: true, data: chaves });
  } catch (err) {
    console.error('Erro em listarChavesPix:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ------------------- Deletar Chave Pix -------------------
pixController.deletarChave = async (req, res) => {
  try {
    const { chave } = req.body;
    if (!chave) throw new Error('Chave é obrigatória');

    const usuario = await User.findById(req.user.id);
    if (!usuario) throw new Error('Usuário não encontrado');

    const pixUsuario = await PixUsuario.findOne({ usuario: req.user.id });
    if (!pixUsuario) throw new Error('Nenhuma chave Pix encontrada para o usuário');

    const chaveIndex = pixUsuario.chaves.findIndex(c => c.valor === chave);
    if (chaveIndex === -1) throw new Error('Chave Pix não encontrada');

    pixUsuario.chaves.splice(chaveIndex, 1);
    await pixUsuario.save();

    usuario.chavesPix = pixUsuario.chaves;
    await usuario.save();

    res.status(200).json({ success: true, message: 'Chave Pix deletada com sucesso' });
  } catch (err) {
    console.error('Erro em deletarChave:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ------------------- Export Default -------------------
export default pixController;
