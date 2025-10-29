<<<<<<< HEAD
import Transaction from '../models/Transaction.js';
import Usuario from '../models/Usuario.js';
import Fatura from '../models/Fatura.js'; // Modelo Fatura real

// =================== FUNÇÃO AUXILIAR ===================
// Remove faturas duplicadas ou antigas
async function limparFaturasPendentes(usuarioId) {
  const faturasPendentes = await Fatura.find({
    usuario: usuarioId,
    status: 'aberta',
=======
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Usuario from '../models/Usuario.js';

// =================== FUNÇÃO AUXILIAR ===================
// Remove faturas pendentes duplicadas
async function limparFaturasPendentes(usuarioId) {
  const faturasPendentes = await Transaction.find({
    usuario: usuarioId,
    tipo: 'fatura_aberta',
    status: 'pendente',
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
  }).sort({ createdAt: 1 });

  if (faturasPendentes.length <= 1) return;

  for (let i = 0; i < faturasPendentes.length - 1; i++) {
<<<<<<< HEAD
    await Fatura.findByIdAndDelete(faturasPendentes[i]._id);
=======
    await Transaction.findByIdAndDelete(faturasPendentes[i]._id);
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
  }
}

// =================== ATUALIZA FATURA ABERTA ===================
export async function atualizarFaturaAberta(usuarioId) {
<<<<<<< HEAD
  // Busca a fatura aberta mais recente
  let fatura = await Fatura.findOne({
    usuario: usuarioId,
    status: 'aberta'
  }).sort({ createdAt: -1 });

  // Se não existe, cria uma nova
  if (!fatura) {
    const agora = new Date();
    const mesReferencia = `${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;

    fatura = new Fatura({
      usuario: usuarioId,
      transacoes: [],
      valorTotal: 0,
      status: 'aberta',
      dataVencimento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
      mesReferencia
    });
    await fatura.save();
  }

  // Calcula total apenas com transações de crédito vinculadas
  const transacoesCredito = await Transaction.find({
    usuario: usuarioId,
    tipoOperacao: 'credito',
    fatura: fatura._id,
    status: 'concluida',
  });

  fatura.valorTotal = transacoesCredito.reduce((sum, t) => sum + t.valor, 0);
  await fatura.save();

  const usuario = await Usuario.findById(usuarioId);
  if (usuario) {
    usuario.faturaAtual = fatura.valorTotal;
    await usuario.save();
  }
=======
  let fatura = await Transaction.findOne({ usuario: usuarioId, tipo: 'fatura_aberta', status: 'pendente' }).sort({ createdAt: -1 });

  if (!fatura) {
    fatura = await Transaction.create({
      usuario: usuarioId,
      tipo: 'fatura_aberta',
      descricao: 'Fatura aberta',
      valor: 0,
      tipoOperacao: 'credito',
      status: 'pendente',
    });
  }

  // Recalcula fatura somando todas as transações de crédito/débito relacionadas
  const transacoes = await Transaction.find({
    usuario: usuarioId,
    tipoOperacao: 'debito',
    status: 'concluida',
    $or: [{ tipo: { $ne: 'antecipacao' } }, { tipo: { $ne: 'pagamento_fatura' } }],
  });

  let totalDebito = 0;
  transacoes.forEach(tx => totalDebito += Number(tx.valor));

  fatura.valor = totalDebito;
  await fatura.save();

  // Atualiza usuário
  const usuario = await Usuario.findById(usuarioId);
  usuario.faturaAtual = fatura.valor;
  await usuario.save();
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

  return fatura;
}

<<<<<<< HEAD
export async function criarTransacao(req, res) {
  try {
    const { tipo, valor, descricao } = req.body;
    const usuario = await Usuario.findById(req.user._id);
    if (!usuario) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) 
      return res.status(400).json({ success: false, error: 'Valor inválido' });

    // Cria transação
    const transacao = await Transaction.create({
      usuario: usuario._id,
      tipo,
      descricao,
      valor: valorNum,
      tipoOperacao: "credito",
      status: "concluida",
      data: new Date(),
      nomeRemetente: usuario.nome,
      nomeRecebedor: "Cartão de Crédito"
    });

    // Pega mês atual
    const agora = new Date();
    const mesReferencia = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

    // Recupera fatura aberta ou cria nova
    let fatura = await Fatura.gerarFatura(usuario._id, mesReferencia);

    // Adiciona transação à fatura e recalcula total
    fatura.transacoes.push(transacao._id);
    await fatura.recalcularValor();

    return res.json({
      success: true,
      transacao,
      faturaAtual: fatura.valorTotal,
      saldoAtual: usuario.saldo
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}


// =================== ANTECIPAR FATURA ===================
export const anteciparFatura = async (req, res) => {
  try {
    const { valor } = req.body;
    const usuarioId = req.user._id;
    const valorNum = Number(valor);

    if (!valor || isNaN(valorNum) || valorNum <= 0)
      return res.status(400).json({ success: false, mensagem: 'Valor inválido. Deve ser maior que zero.' });

    const fatura = await atualizarFaturaAberta(usuarioId);
    const usuario = await Usuario.findById(usuarioId);

    if (valorNum > usuario.saldo)
      return res.status(400).json({ success: false, mensagem: `Saldo insuficiente. Disponível: R$ ${usuario.saldo.toFixed(2)}` });

    if (valorNum > fatura.valorTotal)
      return res.status(400).json({ success: false, mensagem: `Valor excede a fatura. Máximo: R$ ${fatura.valorTotal.toFixed(2)}` });

    usuario.saldo -= valorNum;
    fatura.valorTotal -= valorNum;
    if (fatura.valorTotal <= 0) fatura.status = 'concluida';
=======
// =================== CRIAR TRANSAÇÃO ===================
export async function criarTransacao(req, res) {
  try {
    let { tipo, valor, contaDestino, descricao, operador, numeroCelular, contaOrigem, tipoOperacao } = req.body;

    if (!tipo) return res.status(400).json({ success: false, error: 'Tipo de transação é obrigatório' });

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) return res.status(400).json({ success: false, error: 'Valor inválido' });

    const usuario = await Usuario.findById(req.user._id);
    if (!usuario) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });

    tipo = String(tipo).toLowerCase();
    tipoOperacao = String(tipoOperacao || (tipo === 'deposito' ? 'credito' : 'debito')).toLowerCase();

    let taxa = 0;
    let descricaoFinal = descricao || '';
    let usuarioDestino = null;
    let nomeRecebedor = null;

    switch (tipo) {
      case 'deposito':
        descricaoFinal = `Depósito de ${contaOrigem || 'conta externa'}`;
        await usuario.atualizarSaldo({ valor: valorNum, tipoOperacao: 'credito', descricao: descricaoFinal });
        nomeRecebedor = usuario.nome;
        break;

      case 'pagamento':
      case 'pagamento_boleto':
        taxa = Number((valorNum * 0.02).toFixed(2));
        descricaoFinal = `Pagamento de boleto: ${descricao || ''}`;
        await usuario.atualizarSaldo({ valor: valorNum + taxa, tipoOperacao: 'debito', descricao: descricaoFinal });
        nomeRecebedor = 'Boleto';
        break;

      case 'recarga':
        taxa = Number((valorNum * 0.01).toFixed(2));
        descricaoFinal = `Recarga para ${operador || 'operador'} (${numeroCelular || ''})`;
        await usuario.atualizarSaldo({ valor: valorNum + taxa, tipoOperacao: 'debito', descricao: descricaoFinal });
        nomeRecebedor = operador || 'Operador';
        break;

      case 'transferencia':
        taxa = Number((valorNum * 0.015).toFixed(2));
        if (!contaDestino) return res.status(400).json({ success: false, error: 'Conta de destino é obrigatória' });

        usuarioDestino = await Usuario.findOne({ numeroConta: contaDestino });
        if (!usuarioDestino) return res.status(404).json({ success: false, error: 'Conta de destino não encontrada' });
        if (usuarioDestino._id.equals(usuario._id)) return res.status(400).json({ success: false, error: 'Não é possível transferir para a própria conta' });

        descricaoFinal = `Transferência para ${usuarioDestino.nome} (${contaDestino})`;

        await usuario.atualizarSaldo({ valor: valorNum + taxa, tipoOperacao: 'debito', descricao: descricaoFinal });
        await usuarioDestino.atualizarSaldo({ valor: valorNum, tipoOperacao: 'credito', descricao: `Recebido de ${usuario.nome} (${usuario.numeroConta})` });

        nomeRecebedor = usuarioDestino.nome;

        // Atualiza fatura do destinatário
        await atualizarFaturaAberta(usuarioDestino._id);
        break;

      default:
        return res.status(400).json({ success: false, error: 'Tipo de transação inválido' });
    }

    const transacao = new Transaction({
      tipo,
      valor: tipoOperacao === 'debito' ? -valorNum : valorNum,
      operador: operador || null,
      numeroCelular: numeroCelular || null,
      contaOrigem: contaOrigem || usuario.numeroConta,
      contaDestino: contaDestino || (usuarioDestino ? usuarioDestino.numeroConta : null),
      descricao: descricaoFinal,
      tipoOperacao,
      taxa,
      status: 'concluida',
      usuario: usuario._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: nomeRecebedor || 'N/A',
      data: new Date(),
    });

    await transacao.save();

    if (tipoOperacao === 'credito') {
      await limparFaturasPendentes(usuario._id);
      await atualizarFaturaAberta(usuario._id);
    }

    const usuarioAtualizado = await Usuario.findById(usuario._id).select('saldo faturaAtual creditoUsado').lean();

    return res.json({
      success: true,
      data: transacao,
      saldoAtual: Number(usuarioAtualizado?.saldo || 0),
      faturaAtual: Number(usuarioAtualizado?.faturaAtual || 0),
      creditoUsado: Number(usuarioAtualizado?.creditoUsado || 0),
    });

  } catch (err) {
    console.error('Erro ao criar transação:', err);
    return res.status(500).json({ success: false, error: `Erro ao criar transação: ${err.message}` });
  }
}

// =================== ANTECIPAR FATURA ===================
export const anteciparFatura = async (req, res) => {
  try {
    let { valor } = req.body;
    const usuarioId = req.user._id;

    if (!valor || valor <= 0) 
      return res.status(400).json({ mensagem: 'Valor inválido para antecipação.' });
    
    valor = Number(valor);

    // 1️⃣ Limpa faturas duplicadas
    await limparFaturasPendentes(usuarioId);

    // 2️⃣ Busca fatura aberta mais recente ou cria uma
    let fatura = await Transaction.findOne({ 
      usuario: usuarioId, 
      tipo: 'fatura_aberta', 
      status: 'pendente' 
    }).sort({ createdAt: -1 });

    if (!fatura) {
      fatura = await Transaction.create({
        usuario: usuarioId,
        tipo: 'fatura_aberta',
        descricao: 'Fatura aberta',
        valor: 0,
        tipoOperacao: 'credito',
        status: 'pendente',
      });
    }

    // 3️⃣ Calcula o valor real da fatura somando todas transações de débito concluídas
    const transacoesDebito = await Transaction.find({
      usuario: usuarioId,
      tipoOperacao: 'debito',
      status: 'concluida',
      tipo: { $ne: 'antecipacao' } // ignora antecipações
    });

    let totalDebito = 0;
    transacoesDebito.forEach(tx => totalDebito += Number(tx.valor));

    fatura.valor = totalDebito > 0 ? totalDebito : 0;
    await fatura.save();

    // 4️⃣ Valida valor da fatura e saldo do usuário
    const usuario = await Usuario.findById(usuarioId);

    if (fatura.valor <= 0) 
      return res.status(400).json({ mensagem: 'Não há valor a antecipar nesta fatura.' });

    if (valor > usuario.saldo) 
      return res.status(400).json({ mensagem: 'Saldo insuficiente para antecipar este valor.' });

    if (valor > fatura.valor) 
      return res.status(400).json({ mensagem: 'Valor de antecipação excede o valor da fatura atual.' });

    // 5️⃣ Atualiza saldo e fatura
    usuario.saldo -= valor;
    fatura.valor -= valor;

    if (fatura.valor <= 0) {
      fatura.valor = 0;
      fatura.status = 'concluida';
    }
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

    await usuario.save();
    await fatura.save();

<<<<<<< HEAD
    await Transaction.create({
      usuario: usuarioId,
      tipo: 'antecipacao',
      descricao: `Antecipação de R$ ${valorNum.toFixed(2)}`,
      valor: -valorNum,
=======
    // 6️⃣ Cria registro de antecipação vinculado à fatura
    await Transaction.create({
      usuario: usuarioId,
      tipo: 'antecipacao',
      descricao: `Antecipação de fatura no valor de R$ ${valor}`,
      valor,
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
      tipoOperacao: 'debito',
      status: 'concluida',
      referenciaFatura: fatura._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: 'Cartão de Crédito',
      data: new Date(),
      taxa: 0,
    });

<<<<<<< HEAD
    return res.json({
      success: true,
      mensagem: 'Antecipação realizada com sucesso!',
      valorAntecipado: valorNum.toFixed(2),
      novoSaldo: usuario.saldo.toFixed(2),
      faturaRestante: fatura.valorTotal.toFixed(2)
=======
    return res.status(200).json({
      mensagem: 'Antecipação realizada com sucesso!',
      novoSaldo: usuario.saldo,
      faturaAtualizada: fatura
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    });

  } catch (error) {
    console.error('Erro ao antecipar fatura:', error);
<<<<<<< HEAD
    return res.status(500).json({ success: false, mensagem: 'Erro interno do servidor.', erro: error.message });
=======
    return res.status(500).json({ mensagem: 'Erro ao antecipar fatura.', erro: error.message });
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
  }
};

// =================== PAGAR FATURA ===================
export async function pagarFatura(req, res) {
  try {
    const usuario = await Usuario.findById(req.user._id);
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });

<<<<<<< HEAD
    const fatura = await atualizarFaturaAberta(usuario._id);
    if (!fatura || fatura.valorTotal <= 0) return res.status(400).json({ success: false, error: 'Não há fatura a pagar.' });
    if (usuario.saldo < fatura.valorTotal) return res.status(400).json({ success: false, error: 'Saldo insuficiente.' });

    usuario.saldo -= fatura.valorTotal;
    fatura.status = 'concluida';

    await usuario.save();
    await fatura.save();

    await Transaction.create({
      tipo: 'pagar_fatura',
      valor: -fatura.valorTotal,
=======
    await limparFaturasPendentes(usuario._id);
    await atualizarFaturaAberta(usuario._id);

    const valorFatura = Number(usuario.faturaAtual || 0);
    if (valorFatura === 0) return res.status(400).json({ success: false, error: 'Não há fatura a pagar.' });
    if (usuario.saldo < valorFatura) return res.status(400).json({ success: false, error: 'Saldo insuficiente.' });

    if (new Date().getDate() < 10) return res.status(400).json({ success: false, error: 'Fatura só pode ser paga a partir do dia 10 do mês' });

    await usuario.atualizarSaldo({ valor: valorFatura, tipoOperacao: 'debito', descricao: 'Pagamento de fatura do cartão de crédito' });

    const transacao = await Transaction.create({
      tipo: 'pagamento_fatura',
      valor: -valorFatura,
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
      descricao: 'Pagamento de fatura do cartão de crédito',
      tipoOperacao: 'debito',
      status: 'concluida',
      usuario: usuario._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: 'Cartão de Crédito',
      data: new Date(),
      taxa: 0,
    });

<<<<<<< HEAD
=======
    await atualizarFaturaAberta(usuario._id);

>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    const usuarioAtualizado = await Usuario.findById(usuario._id).select('saldo faturaAtual creditoUsado').lean();

    return res.json({
      success: true,
      message: 'Fatura paga com sucesso.',
<<<<<<< HEAD
      saldo: Number(usuarioAtualizado?.saldo || 0).toFixed(2),
      faturaAtual: Number(usuarioAtualizado?.faturaAtual || 0).toFixed(2),
      creditoUsado: Number(usuarioAtualizado?.creditoUsado || 0).toFixed(2),
=======
      saldo: Number(usuarioAtualizado?.saldo || 0),
      faturaAtual: Number(usuarioAtualizado?.faturaAtual || 0),
      creditoUsado: Number(usuarioAtualizado?.creditoUsado || 0),
      transacao,
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    });
  } catch (err) {
    console.error('Erro em pagarFatura:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
<<<<<<< HEAD
=======

// =================== LISTAR TRANSAÇÕES ===================
export async function listarTransacoesComNomes(req, res) {
  try {
    const transacoes = await Transaction.find({ usuario: req.user._id }).sort({ data: -1 }).lean();
    const transacoesFormatadas = transacoes.map(tx => ({
      _id: tx._id,
      tipo: tx.tipo,
      valor: Number(tx.valor),
      descricao: tx.descricao || '',
      status: tx.status || 'concluida',
      data: tx.data,
      contaDestino: tx.contaDestino || '',
      contaOrigem: tx.contaOrigem || '',
      operador: tx.operador || '',
      numeroCelular: tx.numeroCelular || '',
      tipoOperacao: tx.tipoOperacao || 'debito',
      taxa: tx.taxa || 0,
      nomeRemetente: tx.nomeRemetente || 'N/A',
      nomeRecebedor: tx.nomeRecebedor || 'N/A',
    }));

    return res.json({ success: true, data: transacoesFormatadas.slice(0, 200) });
  } catch (err) {
    console.error('Erro ao listar transações:', err);
    return res.status(500).json({ success: false, error: `Erro ao listar transações: ${err.message}` });
  }
}

// =================== OBTER FATURA ATUAL ===================
export async function getFaturaAtual(req, res) {
  try {
    const usuario = await Usuario.findById(req.user._id).select('faturaAtual limiteCredito creditoUsado');
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    return res.json({
      success: true,
      faturaAtual: Number(usuario.faturaAtual || 0),
      limiteCredito: Number(usuario.limiteCredito || 0),
      creditoUsado: Number(usuario.creditoUsado || 0),
    });
  } catch (err) {
    console.error('Erro ao obter fatura:', err);
    return res.status(500).json({ success: false, error: `Erro ao obter fatura: ${err.message}` });
  }
}

// =================== LISTAR FATURAS ===================
export async function listarFaturas(req, res) {
  try {
    const usuarioId = req.user._id;
    const faturas = await Transaction.find({ usuario: usuarioId, tipo: 'fatura_aberta' }).sort({ data: -1 }).lean();

    return res.json({
      success: true,
      data: faturas.map(f => ({
        _id: f._id,
        valor: Number(f.valor || 0),
        status: f.status,
        data: f.data,
        descricao: f.descricao,
      })),
    });
  } catch (err) {
    console.error('[listarFaturas] Erro:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
