import Transaction from '../models/Transaction.js';
import Usuario from '../models/Usuario.js';


// =================== ATUALIZA FATURA ABERTA CORRETA ===================
export async function atualizarFaturaAberta(usuarioId) {
  // Buscar fatura pendente mais recente
  let fatura = await Transaction.findOne({
    usuario: usuarioId,
    tipo: 'fatura_aberta',
    status: 'pendente'
  }).sort({ createdAt: -1 });

  // Se não existir, cria uma nova
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

  // Buscar todas as transações concluídas que afetam a fatura
  const transacoes = await Transaction.find({
    usuario: usuarioId,
    status: 'concluida',
  });

  let totalDebito = 0;       // compras / débitos que aumentam a fatura
  let totalPagamentos = 0;   // pagamentos/antecipações que reduzem a fatura

  transacoes.forEach(tx => {
    // Somar débitos (compras, etc.)
    if (tx.tipoOperacao === 'debito' && tx.tipo !== 'antecipacao') {
      totalDebito += Number(tx.valor || 0);
    }

    // Somar pagamentos de boleto (reduzem a fatura, não mexem no saldo)
    if (tx.tipo === 'pagamento_boleto') {
      totalPagamentos += Number(tx.valor || 0);
    }

    // Somar antecipações (reduzem fatura e mexem no saldo)
    if (tx.tipo === 'antecipacao') {
      totalPagamentos += Number(tx.valor || 0);
    }
  });

  // Atualizar valor da fatura
  fatura.valor = totalDebito - totalPagamentos;
  fatura.valor = fatura.valor > 0 ? fatura.valor : 0;
  fatura.status = fatura.valor <= 0 ? 'concluida' : 'pendente';
  await fatura.save();

  // Atualizar campo faturaAtual do usuário (saldo da fatura, não o saldo da conta)
  const usuario = await Usuario.findById(usuarioId);
  if (usuario) {
    usuario.faturaAtual = fatura.valor;
    await usuario.save();
  }

  return fatura;
};

export async function pagarFatura(req, res) {
  try {
    const usuarioId = req.user._id;
    const { valor } = req.body;

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(404).json({ success: false, mensagem: 'Usuário não encontrado' });

    let fatura = await Transaction.findOne({ usuario: usuarioId, tipo: 'fatura_aberta', status: 'pendente' });
    if (!fatura) return res.status(404).json({ success: false, mensagem: 'Nenhuma fatura encontrada' });

    // Valor pago
    const valorPago = Math.min(Number(valor), fatura.valor, usuario.saldo);
    if (valorPago <= 0) return res.status(400).json({ success: false, mensagem: 'Saldo insuficiente ou valor inválido' });

    // Atualizar fatura e usuário
    fatura.valor -= valorPago;
    if (fatura.valor <= 0) fatura.status = 'concluida';
    usuario.saldo -= valorPago;
    usuario.faturaAtual = fatura.valor;

    await fatura.save();
    await usuario.save();

    // Criar transação de pagamento
    await Transaction.create({
      usuario: usuarioId,
      tipo: 'pagamento_boleto',
      descricao: `Pagamento de fatura: ${valorPago.toFixed(2)}`,
      valor: -valorPago,
      tipoOperacao: 'debito',
      status: 'concluida',
      nomeRemetente: usuario.nome,
      nomeRecebedor: 'Cartão de Crédito',
      data: new Date(),
      taxa: 0
    });

    return res.status(200).json({
      success: true,
      mensagem: 'Pagamento realizado com sucesso!',
      faturaRestante: fatura.valor.toFixed(2),
      novoSaldo: usuario.saldo.toFixed(2)
    });

  } catch (err) {
    console.error('[pagarFatura] Erro:', err);
    return res.status(500).json({ success: false, mensagem: 'Erro interno ao pagar fatura', erro: err.message });
  }
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
// ==========================
// GERAR PDF DA FATURA ATUAL
// ==========================
export async function gerarFaturaPDF(req, res) {
  try {
    const usuarioId = req.user._id;

    // Buscar usuário e fatura atual
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const fatura = await Transaction.findOne({
      usuario: usuarioId,
      tipo: 'fatura_aberta'
    }).sort({ createdAt: -1 });

    if (!fatura) return res.status(404).json({ success: false, error: 'Nenhuma fatura encontrada' });

    // Buscar transações vinculadas à fatura (débitos e pagamentos)
    const transacoes = await Transaction.find({
      usuario: usuarioId,
      $or: [
        { tipoOperacao: 'debito' },
        { referenciaFatura: fatura._id }
      ]
    }).sort({ data: 1 });

    // Criar PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=fatura_${usuario.numeroConta}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text(`Fatura do Usuário: ${usuario.nome}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Número da Conta: ${usuario.numeroConta}`);
    doc.text(`Data: ${new Date().toLocaleDateString()}`);
    doc.text(`Status da Fatura: ${fatura.status}`);
    doc.text(`Valor Total: R$ ${Number(fatura.valor).toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text('Transações:', { underline: true });
    doc.moveDown();

    transacoes.forEach(tx => {
      const tipo = tx.tipoOperacao === 'debito' ? 'Débito' : 'Crédito';
      const valor = Number(tx.valor).toFixed(2);
      const data = new Date(tx.data).toLocaleString();
      const desc = tx.descricao || tx.tipo;
      doc.fontSize(12).text(`${data} — ${tipo} — ${desc} — R$ ${valor}`);
    });

    doc.end();

  } catch (err) {
    console.error('[gerarFaturaPDF] Erro:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}