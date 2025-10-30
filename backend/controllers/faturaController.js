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
