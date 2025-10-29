import Transaction from '../models/Transaction.js';
import Usuario from '../models/Usuario.js';
import Fatura from '../models/Fatura.js'; // Modelo Fatura real

// =================== FUNÇÃO AUXILIAR ===================
// Remove faturas duplicadas ou antigas
async function limparFaturasPendentes(usuarioId) {
  const faturasPendentes = await Fatura.find({
    usuario: usuarioId,
    status: 'aberta',
  }).sort({ createdAt: 1 });

  if (faturasPendentes.length <= 1) return;

  for (let i = 0; i < faturasPendentes.length - 1; i++) {
    await Fatura.findByIdAndDelete(faturasPendentes[i]._id);
  }
}

// =================== ATUALIZA FATURA ABERTA ===================
export async function atualizarFaturaAberta(usuarioId) {
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

  return fatura;
}

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

    await usuario.save();
    await fatura.save();

    await Transaction.create({
      usuario: usuarioId,
      tipo: 'antecipacao',
      descricao: `Antecipação de R$ ${valorNum.toFixed(2)}`,
      valor: -valorNum,
      tipoOperacao: 'debito',
      status: 'concluida',
      referenciaFatura: fatura._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: 'Cartão de Crédito',
      data: new Date(),
      taxa: 0,
    });

    return res.json({
      success: true,
      mensagem: 'Antecipação realizada com sucesso!',
      valorAntecipado: valorNum.toFixed(2),
      novoSaldo: usuario.saldo.toFixed(2),
      faturaRestante: fatura.valorTotal.toFixed(2)
    });

  } catch (error) {
    console.error('Erro ao antecipar fatura:', error);
    return res.status(500).json({ success: false, mensagem: 'Erro interno do servidor.', erro: error.message });
  }
};

// =================== PAGAR FATURA ===================
export async function pagarFatura(req, res) {
  try {
    const usuario = await Usuario.findById(req.user._id);
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });

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
      descricao: 'Pagamento de fatura do cartão de crédito',
      tipoOperacao: 'debito',
      status: 'concluida',
      usuario: usuario._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: 'Cartão de Crédito',
      data: new Date(),
      taxa: 0,
    });

    const usuarioAtualizado = await Usuario.findById(usuario._id).select('saldo faturaAtual creditoUsado').lean();

    return res.json({
      success: true,
      message: 'Fatura paga com sucesso.',
      saldo: Number(usuarioAtualizado?.saldo || 0).toFixed(2),
      faturaAtual: Number(usuarioAtualizado?.faturaAtual || 0).toFixed(2),
      creditoUsado: Number(usuarioAtualizado?.creditoUsado || 0).toFixed(2),
    });
  } catch (err) {
    console.error('Erro em pagarFatura:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
