import Transaction from '../models/Transaction.js';
import Usuario from '../models/Usuario.js';

// =================== LIMPAR FATURAS DUPLICADAS ===================
export async function limparFaturasPendentes(usuarioId) {
  const faturasPendentes = await Transaction.find({
    usuario: usuarioId,
    tipo: 'fatura_aberta',
    status: 'pendente',
  }).sort({ createdAt: 1 });

  if (faturasPendentes.length <= 1) return;

  for (let i = 0; i < faturasPendentes.length - 1; i++) {
    await Transaction.findByIdAndDelete(faturasPendentes[i]._id);
  }
}

// =================== ATUALIZA FATURA ABERTA ===================
export async function atualizarFaturaAberta(usuarioId) {
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

  // Soma todas transações de débito concluídas, exceto antecipações
  const transacoesDebito = await Transaction.find({
    usuario: usuarioId,
    tipoOperacao: 'debito',
    status: 'concluida',
    tipo: { $ne: 'antecipacao' }
  });

  let totalDebito = 0;
  transacoesDebito.forEach(tx => totalDebito += Number(tx.valor));

  fatura.valor = totalDebito > 0 ? totalDebito : 0;

  // Se a fatura zerou, marca como concluída
  if (fatura.valor <= 0) {
    fatura.status = 'concluida';
  }

  await fatura.save();

  // Atualiza campo faturaAtual no usuário
  const usuario = await Usuario.findById(usuarioId);
  usuario.faturaAtual = fatura.valor;
  await usuario.save();

  return fatura;
}

// =================== LISTAR FATURAS ===================
export async function listarFaturas(req, res) {
  try {
    const usuarioId = req.user._id;
    const faturas = await Transaction.find({
      usuario: usuarioId,
      tipo: 'fatura_aberta'
    }).sort({ data: -1 }).lean();

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

// =================== OBTER FATURA ATUAL ===================
export async function getFaturaAtual(req, res) {
  try {
    const usuario = await Usuario.findById(req.user._id)
      .select('faturaAtual limiteCredito creditoUsado');
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
