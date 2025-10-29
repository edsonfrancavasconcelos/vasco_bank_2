<<<<<<< HEAD
import Fatura from "../models/Fatura.js";
import Transaction from "../models/Transaction.js";
import Usuario from "../models/Usuario.js";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

// ========================
// GERAR PDF DA FATURA
// ========================
export async function gerarFaturaPDF(req, res) {
  try {
    const usuarioId = req.user._id;
    const { faturaId } = req.body;

    const fatura = await Fatura.findOne({ _id: faturaId, usuario: usuarioId }).populate("transacoes");
    if (!fatura) return res.status(404).json({ success: false, message: "Fatura não encontrada" });

    const usuario = await Usuario.findById(usuarioId);

    // Cria PDF
    const doc = new PDFDocument();
    const filePath = path.join("uploads", `fatura-${faturaId}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(18).text("FATURA - VascoBank", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Cliente: ${usuario.nome}`);
    doc.text(`Período: ${fatura.mesReferencia}`);
    doc.text(`Vencimento: ${fatura.dataVencimento.toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(12).text("Transações:");
    if (fatura.transacoes.length === 0) {
      doc.text("- Nenhuma transação registrada");
    } else {
      fatura.transacoes.forEach(tx => {
        doc.text(`- ${tx.descricao || tx.tipoOperacao} | R$ ${tx.valor.toFixed(2)} | ${tx.status}`);
      });
    }

    doc.moveDown();
    doc.fontSize(14).text(`Total da Fatura: R$ ${fatura.valorTotal.toFixed(2)}`, { align: "right" });
    doc.end();

    res.json({ success: true, message: "PDF gerado com sucesso", filePath });
  } catch (err) {
    console.error("[gerarFaturaPDF] Erro:", err);
    res.status(500).json({ success: false, message: "Erro ao gerar PDF da fatura", error: err.message });
  }
}

// ========================
// GERAR NOVA FATURA
// ========================
export const gerarFatura = async (req, res) => {
  try {
    const usuarioId = req.user._id;

    // Transações de crédito sem fatura
    const transacoesCredito = await Transaction.find({
      usuario: usuarioId,
      tipoOperacao: "credito",
      fatura: null
    });

    if (transacoesCredito.length === 0) {
      return res.status(404).json({ message: "Nenhuma transação de crédito para gerar fatura." });
    }

    const valorTotal = transacoesCredito.reduce((sum, t) => sum + t.valor, 0);

    const fatura = new Fatura({
      usuario: usuarioId,
      transacoes: transacoesCredito.map(t => t._id),
      valorTotal,
      status: valorTotal > 0 ? "aberta" : "paga",
      dataVencimento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      mesReferencia: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
    });

    await fatura.save();

    // Vincula transações à fatura
    for (const t of transacoesCredito) {
      t.fatura = fatura._id;
      await t.save();
    }

    res.status(201).json({ message: "Fatura gerada com sucesso!", fatura });
  } catch (error) {
    console.error("Erro ao gerar fatura:", error);
    res.status(500).json({ message: "Erro ao gerar fatura", error: error.message });
  }
};

// ========================
// BUSCAR FATURA ATUAL / ABERTA
// ========================
export const buscarFaturaAtual = async (req, res) => {
  try {
    const usuarioId = req.user._id;

    let fatura = await Fatura.findOne({ usuario: usuarioId, status: "aberta" }).populate("transacoes");

    if (!fatura) {
      return res.status(404).json({ message: "Nenhuma fatura aberta encontrada." });
    }

    // Recalcula valorTotal apenas com transações de crédito
    fatura.valorTotal = fatura.transacoes
      .filter(t => t.tipoOperacao === "credito")
      .reduce((sum, t) => sum + t.valor, 0);

    await fatura.save();

    res.json({
      success: true,
      data: {
        id: fatura._id,
        fatura: fatura.valorTotal,
        status: fatura.status,
        data: fatura.createdAt,
        dataVencimento: fatura.dataVencimento,
        transacoes: fatura.transacoes
      }
    });
  } catch (error) {
    console.error("Erro ao buscar fatura:", error);
    res.status(500).json({ message: "Erro interno", error: error.message });
  }
};

// ========================
// PAGAR FATURA
// ========================
export const pagarFatura = async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const { faturaId } = req.body;

    const fatura = await Fatura.findOne({ _id: faturaId, usuario: usuarioId }).populate("transacoes");
    if (!fatura) return res.status(404).json({ message: "Fatura não encontrada" });

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(404).json({ message: "Usuário não encontrado" });

    if (usuario.saldo < fatura.valorTotal) {
      return res.status(400).json({ message: `Saldo insuficiente. Disponível: R$ ${usuario.saldo.toFixed(2)}` });
    }

    // Deduz saldo e fecha fatura
    usuario.saldo -= fatura.valorTotal;
    fatura.status = "paga";
    fatura.dataPagamento = new Date();

    await usuario.save();
    await fatura.save();

    // Cria transação de débito
    await Transaction.create({
      usuario: usuarioId,
      tipo: "pagar_fatura",
      descricao: `Pagamento da fatura ${fatura._id}`,
      valor: fatura.valorTotal,
      tipoOperacao: "debito",
      status: "concluida",
      fatura: fatura._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: "Cartão de Crédito",
      data: new Date()
    });

    res.json({
      success: true,
      message: "Fatura paga com sucesso",
      fatura: {
        id: fatura._id,
        fatura: fatura.valorTotal,
        status: fatura.status
      },
      saldoAtual: usuario.saldo.toFixed(2)
    });
  } catch (error) {
    console.error("Erro ao pagar fatura:", error);
    res.status(500).json({ message: "Erro ao pagar fatura", error: error.message });
  }
};
=======
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
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
