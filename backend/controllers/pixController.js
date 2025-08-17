const Transaction = require('../models/Transaction');
const PixUsuario = require('../models/PixUsuario');
const QRCode = require('qrcode');
const crypto = require('crypto'); 


// Função para calcular o CRC16 (necessário para o payload Pix)
function calculateCRC16(data) {
  const polynomial = 0x1021;
  let crc = 0xffff;
  for (let char of data) {
    const byte = char.charCodeAt(0);
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).padStart(4, '0').toUpperCase();
}
 // adicione no topo do arquivo

async function criarChavePix(req, res) {
  try {
    let { tipo, valor } = req.body;

    if (!tipo) {
      return res.status(400).json({ error: 'Tipo da chave é obrigatório' });
    }

    if (tipo === 'aleatoria') {
      // Gera uma chave UUID aleatória automaticamente
      valor = crypto.randomUUID();
    } else {
      // Para outros tipos, valor é obrigatório
      if (!valor) {
        return res.status(400).json({ error: 'Valor da chave é obrigatório para este tipo' });
      }
    }

    let pixUsuario = await PixUsuario.findOne({ usuario: req.user._id });
    if (!pixUsuario) {
      pixUsuario = new PixUsuario({ usuario: req.user._id, chaves: [] });
    }

    // Evitar duplicidade: checar se chave já existe
    const chaveExistente = await PixUsuario.findOne({ 'chaves.valor': valor });
    if (chaveExistente) {
      return res.status(409).json({ error: 'Chave Pix já cadastrada' });
    }

    pixUsuario.chaves.push({ tipo, valor });
    await pixUsuario.save();

    res.status(201).json({ message: 'Chave Pix criada com sucesso', chave: { tipo, valor } });
  } catch (err) {
    console.error('Erro ao criar chave Pix:', err);
    res.status(500).json({ error: 'Erro ao criar chave Pix' });
  }
}


// Obter chaves Pix do usuário logado
async function getChavesPix(req, res) {
  try {
    const pixUsuario = await PixUsuario.findOne({ usuario: req.user._id });
    res.json(pixUsuario ? pixUsuario.chaves : []);
  } catch (err) {
    console.error('Erro ao buscar chaves Pix:', err);
    res.status(500).json({ error: 'Erro ao buscar chaves Pix' });
  }
}

// Criar chave Pix para o usuário logado
async function criarChavePix(req, res) {
  try {
    const { tipo, valor } = req.body;
    if (!tipo || !valor) {
      return res.status(400).json({ error: 'Tipo e valor da chave são obrigatórios' });
    }

    let pixUsuario = await PixUsuario.findOne({ usuario: req.user._id });
    if (!pixUsuario) {
      pixUsuario = new PixUsuario({ usuario: req.user._id, chaves: [] });
    }

    pixUsuario.chaves.push({ tipo, valor });
    await pixUsuario.save();

    res.status(201).json({ message: 'Chave Pix criada com sucesso', pixUsuario });
  } catch (err) {
    console.error('Erro ao criar chave Pix:', err);
    res.status(500).json({ error: 'Erro ao criar chave Pix' });
  }
}

// Histórico de transações Pix do usuário logado
async function getHistoricoPix(req, res) {
  try {
    const transacoes = await Transaction.find({ usuario: req.user._id }).sort({ data: -1 });
    res.json(transacoes);
  } catch (err) {
    console.error('Erro ao buscar histórico Pix:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico Pix' });
  }
}

// Enviar Pix para uma chave destino
async function enviarPix(req, res) {
  try {
    const { chave, valor, descricao } = req.body;
    if (!chave || !valor) {
      return res.status(400).json({ error: 'Chave e valor são obrigatórios' });
    }

    const destinatario = await PixUsuario.findOne({ 'chaves.valor': chave });
    if (!destinatario) {
      return res.status(404).json({ error: 'Chave Pix de destino não encontrada' });
    }

    const transacao = await Transaction.create({
      usuario: req.user._id,
      deUsuario: req.user._id,
      tipo: 'enviar_pix',
      chave,
      valor,
      descricao,
      status: 'enviado',
      data: new Date()
    });

    res.status(201).json({ message: 'Pix enviado com sucesso', transacao });
  } catch (err) {
    console.error('Erro ao enviar Pix:', err);
    res.status(500).json({ error: 'Erro ao enviar Pix' });
  }
}

// Receber Pix
async function receberPix(req, res) {
  try {
    const { chave, valor, descricao } = req.body;
    console.log('Dados recebidos no receberPix:', { chave, valor, descricao });

    if (!chave || !valor) {
      return res.status(400).json({ error: 'Chave e valor são obrigatórios' });
    }

    const valorFloat = parseFloat(valor);
    if (isNaN(valorFloat)) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    // Verifica se a chave existe no banco
    const pixUsuario = await PixUsuario.findOne({ 'chaves.valor': chave });
    if (!pixUsuario) {
      return res.status(404).json({ error: 'Chave Pix não encontrada' });
    }

    const transacao = await Transaction.create({
      usuario: req.user._id,
      tipo: 'receber_pix',
      chave,
      valor: valorFloat,
      descricao,
      status: 'pendente', // Status pendente até confirmação do pagamento
      data: new Date()
    });

    // Gera payload Pix manualmente
    const merchantName = 'Vasco Bank';
    const merchantCity = 'SAO PAULO';
    const txid = `tx${Date.now()}`;
    const payload = [
      '000201', // Payload Format Indicator
      '010212', // Dynamic QR Code
      `26${chave.length + 14}0014br.gov.bcb.pix01${chave.length}${chave}`, // Pix Key
      '52040000', // Merchant Category Code
      '5303986', // Currency (BRL)
      `54${valorFloat.toFixed(2).length}${valorFloat.toFixed(2)}`, // Amount
      '5802BR', // Country Code
      `59${merchantName.length}${merchantName}`, // Merchant Name
      `60${merchantCity.length}${merchantCity}`, // Merchant City
      `61${txid.length}${txid}`, // Transaction ID
      '6304', // CRC16 placeholder
    ].join('');

    const payloadString = payload + calculateCRC16(payload);
    console.log('Payload Pix gerado:', payloadString);

    const qrCodeBase64 = await QRCode.toDataURL(payloadString);
    console.log('QR Code gerado com sucesso');

    res.status(201).json({
      message: 'Pix configurado com sucesso',
      transacao,
      qrCodeBase64,
      pixPayload: payloadString
    });
  } catch (err) {
    console.error('Erro ao receber Pix:', err);
    res.status(500).json({ error: err.message || 'Erro ao receber Pix' });
  }
}

// Cobrar Pix
async function cobrarPix(req, res) {
  try {
    const { chave, valor, descricao } = req.body;
    if (!valor) {
      return res.status(400).json({ error: 'Valor é obrigatório' });
    }

    const valorFloat = parseFloat(valor);
    if (isNaN(valorFloat)) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const transacao = await Transaction.create({
      usuario: req.user._id,
      tipo: 'cobrar_pix',
      chave,
      valor: valorFloat,
      descricao,
      status: 'pendente',
      data: new Date()
    });

    // Gera payload Pix manualmente
    const merchantName = 'Vasco Bank';
    const merchantCity = 'SAO PAULO';
    const txid = `tx${Date.now()}`;
    const payload = [
      '000201',
      '010212',
      `26${chave.length + 14}0014br.gov.bcb.pix01${chave.length}${chave}`,
      '52040000',
      '5303986',
      `54${valorFloat.toFixed(2).length}${valorFloat.toFixed(2)}`,
      '5802BR',
      `59${merchantName.length}${merchantName}`,
      `60${merchantCity.length}${merchantCity}`,
      `61${txid.length}${txid}`,
      '6304',
    ].join('');

    const payloadString = payload + calculateCRC16(payload);
    const qrCodeBase64 = await QRCode.toDataURL(payloadString);

    res.status(201).json({
      message: 'Cobrança Pix criada com sucesso',
      transacao,
      qrCodeBase64,
      pixPayload: payloadString
    });
  } catch (err) {
    console.error('Erro ao criar cobrança Pix:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar cobrança Pix' });
  }
}

// Agendar Pix
async function agendarPix(req, res) {
  try {
    const { chave, valor, descricao, dataAgendamento } = req.body;
    if (!valor || !dataAgendamento) {
      return res.status(400).json({ error: 'Valor e data de agendamento são obrigatórios' });
    }

    const valorFloat = parseFloat(valor);
    if (isNaN(valorFloat)) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const transacao = await Transaction.create({
      usuario: req.user._id,
      tipo: 'agendamento_pix',
      chave,
      valor: valorFloat,
      descricao,
      status: 'agendado',
      dataAgendamento: new Date(dataAgendamento)
    });

    res.status(201).json({ message: 'Pix agendado com sucesso', transacao });
  } catch (err) {
    console.error('Erro ao agendar Pix:', err);
    res.status(500).json({ error: 'Erro ao agendar Pix' });
  }
}

// Buscar as chaves Pix do usuário logado
async function getMinhasChavesPix(req, res) {
  try {
    const pixUsuario = await PixUsuario.findOne({ usuario: req.user._id });
    res.json(pixUsuario ? pixUsuario.chaves : []);
  } catch (err) {
    console.error('Erro ao buscar suas chaves Pix:', err);
    res.status(500).json({ error: 'Erro ao buscar suas chaves Pix' });
  }
}

// Ler QR Code
async function lerQRCode(req, res) {
  try {
    const { codigo } = req.body;
    if (!codigo) {
      return res.status(400).json({ error: 'Código Pix é obrigatório' });
    }
    res.json({ message: 'QR Code lido com sucesso', dados: { codigo } });
  } catch (err) {
    console.error('Erro ao ler QR Code:', err);
    res.status(500).json({ error: 'Erro ao ler QR Code' });
  }
}
async function listarPixTransacoes(req, res) {
  try {
    const transacoesPix = await Transaction.find({
      usuario: req.user._id,
      tipo: { $in: ['enviar_pix', 'agendamento_pix'] }
    })
    .populate('usuario', 'nome')      // dono da transação (você)
    .populate('deUsuario', 'nome')    // quem enviou (se aplicável)
    .sort({ data: -1 });

    const resultado = transacoesPix.map(t => ({
      _id: t._id,
      tipo: t.tipo,
      valor: t.valor,
      descricao: t.descricao,
      status: t.status,
      data: t.data,
      chave: t.chave,
      nomeRemetente: t.deUsuario ? t.deUsuario.nome : (t.usuario ? t.usuario.nome : 'Você'),
      nomeRecebedor: t.chave || t.nomeRecebedor || 'Você',
    }));

    res.json(resultado);
  } catch (err) {
    console.error('Erro listarPixTransacoes:', err);
    res.status(500).json({ error: 'Erro ao buscar transações Pix' });
  }
}
async function excluirChavePix(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Encontrar o PixUsuario do usuário logado
    let pixUsuario = await PixUsuario.findOne({ usuario: userId });
    if (!pixUsuario) {
      return res.status(404).json({ error: 'Nenhuma chave Pix encontrada para este usuário' });
    }

    // Verificar se a chave com o ID fornecido existe
    const chaveIndex = pixUsuario.chaves.findIndex(chave => chave._id.toString() === id);
    if (chaveIndex === -1) {
      return res.status(404).json({ error: 'Chave Pix não encontrada' });
    }

    // Remover a chave do array
    pixUsuario.chaves.splice(chaveIndex, 1);
    await pixUsuario.save();

    console.log(`[${new Date().toISOString()}] Chave Pix excluída: ${id}`);
    res.json({ message: 'Chave Pix excluída com sucesso' });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Erro ao excluir chave Pix:`, err.message, err.stack);
    res.status(500).json({ error: 'Erro ao excluir chave Pix', details: err.message });
  }
}


module.exports = {
  getChavesPix,
  criarChavePix,
  getHistoricoPix,
  enviarPix,
  receberPix,
  cobrarPix,
  agendarPix,
  getMinhasChavesPix,
  excluirChavePix,
  listarPixTransacoes,
  lerQRCode,
};