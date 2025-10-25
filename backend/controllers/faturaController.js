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

  const transacoesDebito = await Transaction.find({
    usuario: usuarioId,
    tipoOperacao: 'debito',
    status: 'concluida',
    tipo: { $ne: 'antecipacao' }
  });

  const totalDebito = transacoesDebito.reduce((acc, tx) => acc + (Number(tx.valor) || 0), 0);
  fatura.valor = totalDebito > 0 ? totalDebito : 0;

  if (fatura.valor <= 0) fatura.status = 'concluida';

  await fatura.save();

  const usuario = await Usuario.findById(usuarioId);
  if (usuario) {
    usuario.faturaAtual = fatura.valor;
    await usuario.save();
  }

  return fatura;
}

// =================== ANTECIPAR FATURA ===================
export async function anteciparFatura(req, res) {
  try {
    const { valor } = req.body;
    const usuarioId = req.user._id;

    // Validação
    const valorAntecipar = Number(valor);
    if (!valor || isNaN(valorAntecipar) || valorAntecipar <= 0) {
      return res.status(400).json({ success: false, mensagem: 'Valor inválido. Deve ser maior que zero.' });
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(404).json({ success: false, mensagem: 'Usuário não encontrado' });

    // Limpar duplicatas
    await limparFaturasPendentes(usuarioId);

    // Buscar fatura
    let fatura = await Transaction.findOne({
      usuario: usuarioId,
      tipo: 'fatura_aberta',
      status: 'pendente'
    }).sort({ createdAt: -1 });

    if (!fatura) return res.status(404).json({ mensagem: "Nenhuma fatura encontrada para antecipar." });
    if (Number(fatura.valor) <= 0) return res.status(400).json({ mensagem: "Não há valor positivo a antecipar nesta fatura." });

    // Valor final da antecipação (não pode exceder saldo nem valor da fatura)
    const valorFinal = Math.min(valorAntecipar, fatura.valor, usuario.saldo);

    if (valorFinal <= 0) {
      return res.status(400).json({ mensagem: "Saldo insuficiente para antecipar a fatura." });
    }

    // Atualiza fatura e usuário
    fatura.valor -= valorFinal;
    if (fatura.valor <= 0) {
      fatura.valor = 0;
      fatura.status = 'concluida';
    }

    usuario.saldo -= valorFinal;
    usuario.faturaAtual = fatura.valor;
    await fatura.save();
    await usuario.save();

    // Criar transação de antecipação
    await Transaction.create({
      usuario: usuarioId,
      tipo: 'antecipacao',
      descricao: `Antecipação de R$ ${valorFinal.toFixed(2)} da fatura`,
      valor: -valorFinal,
      tipoOperacao: 'debito',
      status: 'concluida',
      referenciaFatura: fatura._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: 'Cartão de Crédito',
      data: new Date(),
      taxa: 0,
    });

    return res.status(200).json({
      success: true,
      mensagem: 'Antecipação realizada com sucesso!',
      valorAntecipado: valorFinal.toFixed(2),
      novoSaldo: usuario.saldo.toFixed(2),
      faturaRestante: fatura.valor.toFixed(2)
    });

  } catch (err) {
    console.error('[anteciparFatura] Erro:', err);
    return res.status(500).json({
      success: false,
      mensagem: 'Erro interno ao antecipar fatura.',
      erro: err.message
    });
  }
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
        valor: Number(f.valor || 0).toFixed(2),
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
      .select('faturaAtual limiteCredito creditoUsado saldo');
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    return res.json({
      success: true,
      faturaAtual: Number(usuario.faturaAtual || 0).toFixed(2),
      limiteCredito: Number(usuario.limiteCredito || 0).toFixed(2),
      creditoUsado: Number(usuario.creditoUsado || 0).toFixed(2),
      saldo: Number(usuario.saldo || 0).toFixed(2)
    });
  } catch (err) {
    console.error('Erro ao obter fatura:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
