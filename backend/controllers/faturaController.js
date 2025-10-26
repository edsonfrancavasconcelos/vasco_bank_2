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

  // Mantém só a última
  for (let i = 0; i < faturasPendentes.length - 1; i++) {
    await Transaction.findByIdAndDelete(faturasPendentes[i]._id);
  }
}

// =================== ATUALIZA FATURA ABERTA ===================
export async function atualizarFaturaAberta(usuarioId) {
  // Busca ou cria a fatura aberta
  let fatura = await Transaction.findOne({
    usuario: usuarioId,
    tipo: "fatura_aberta",
    status: "pendente"
  }).sort({ createdAt: -1 });

  if (!fatura) {
    fatura = await Transaction.create({
      usuario: usuarioId,
      tipo: "fatura_aberta",
      descricao: "Fatura aberta",
      valor: 0,
      tipoOperacao: "credito",
      status: "pendente"
    });
  }

  // 🔹 Soma todas as transações de crédito concluídas (compras no crédito)
  const transacoesCredito = await Transaction.find({
    usuario: usuarioId,
    tipoOperacao: "credito",
    status: "concluida",
    tipo: { $ne: "antecipacao" }
  });

  let totalCredito = 0;
  transacoesCredito.forEach(tx => {
    totalCredito += Number(tx.valor || 0);
  });

  // 🔹 Subtrai valores de antecipações pagas
  const antecipacoes = await Transaction.find({
    usuario: usuarioId,
    tipo: "antecipacao",
    status: "concluida"
  });

  let totalAntecipado = 0;
  antecipacoes.forEach(tx => {
    totalAntecipado += Number(tx.valor || 0);
  });

  // 🔹 Valor total da fatura
  const valorFatura = totalCredito - totalAntecipado;
  fatura.valor = valorFatura > 0 ? valorFatura : 0;

  // 🔹 Atualiza status
  fatura.status = fatura.valor > 0 ? "pendente" : "concluida";

  await fatura.save();

  // 🔹 Atualiza o campo no usuário
  const usuario = await Usuario.findById(usuarioId);
  if (usuario) {
    usuario.faturaAtual = fatura.valor;
    await usuario.save();
  }

  console.log(`📘 Fatura atualizada: ${fatura.valor.toFixed(2)} (crédito total: ${totalCredito}, antecipado: ${totalAntecipado})`);

  return fatura;
}


// =================== LISTAR FATURAS ===================
export async function listarFaturas(req, res) {
  try {
    const usuarioId = req.user._id;

    // Atualiza valor antes de listar
    await atualizarFaturaAberta(usuarioId);

    const faturas = await Transaction.find({
      usuario: usuarioId,
      tipo: 'fatura_aberta'
    })
      .sort({ createdAt: -1 })
      .lean();

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
    const usuarioId = req.user._id;

    // Garante atualização em tempo real
    const fatura = await atualizarFaturaAberta(usuarioId);

    const usuario = await Usuario.findById(usuarioId)
      .select('faturaAtual limiteCredito creditoUsado');

    if (!usuario)
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    return res.json({
      success: true,
      faturaAtual: Number(usuario.faturaAtual || fatura.valor || 0),
      limiteCredito: Number(usuario.limiteCredito || 0),
      creditoUsado: Number(usuario.creditoUsado || 0),
      status: fatura.status,
    });
  } catch (err) {
    console.error('Erro ao obter fatura:', err);
    return res.status(500).json({
      success: false,
      error: `Erro ao obter fatura: ${err.message}`,
    });
  }
}
