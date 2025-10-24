// ============================
// Arquivo: userRoutes.js
// ============================

import express from "express";
import Usuario from "../models/Usuario.js";
import Transaction from "../models/Transaction.js";
import { registerUser, loginUser, resetSenha } from "../controllers/userController.js";
import { anteciparFatura } from '../controllers/transactionController.js';
import { protect } from "../middleware/authMiddleware.js";
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import fs from "fs-extra";
import path from "path";
import QRCode from "qrcode";

const router = express.Router();

// 🔓 ROTAS PÚBLICAS
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/reset", resetSenha);
router.post("/reset-password", resetSenha);
router.post("/logout", (req, res) => res.json({ message: "Logout realizado com sucesso" }));

// 🔒 ROTAS PROTEGIDAS

// ✅ Informações do usuário e fatura
router.get("/me", protect, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "Usuário não encontrado." });

    const hoje = new Date();
    const dataVencimentoFatura = new Date(hoje.getFullYear(), hoje.getMonth(), 17);
    const statusFatura = user.faturaAtual > 0 && hoje > dataVencimentoFatura ? "vencida" : "aberta";

    res.json({
      success: true,
      data: {
        nome: user.nome,
        numeroConta: user.numeroConta,
        saldo: Number(user.saldo || 0),
        fatura: Number(user.faturaAtual || 0),
        limiteDisponivel: Number(user.limiteCredito - (user.creditoUsado || 0)),
        dataVencimentoFatura,
        statusFatura,
      },
    });
  } catch (err) {
    console.error("Erro em /me:", err);
    res.status(500).json({ success: false, message: "Erro ao buscar dados do usuário." });
  }
});

// ✅ Histórico do usuário (créditos e débitos)
router.get("/me/historico", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const tipo = req.query.tipo; // 'credito' ou 'debito'
    const filtro = { usuario: userId };
    if (tipo && ["debito", "credito"].includes(tipo)) filtro.tipoOperacao = tipo;

    const transacoes = await Transaction.find(filtro)
      .sort({ data: -1 })
      .lean();

    const resultado = transacoes.map(tx => ({
      _id: tx._id,
      tipo: tx.tipo,
      valor: Number(tx.valor),
      descricao: tx.descricao || "",
      status: tx.status || "concluido",
      data: tx.data,
      tipoOperacao: tx.tipoOperacao || "debito",
      contaOrigem: tx.contaOrigem || "N/A",
      contaDestino: tx.contaDestino || "N/A",
      operador: tx.operador || "N/A",
      numeroCelular: tx.numeroCelular || "N/A",
    }));

    res.json({ success: true, data: resultado });
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    res.status(500).json({ success: false, error: "Erro ao buscar histórico" });
  }
});

// 💳 PAGAR FATURA
router.post("/transaction/pagar-fatura", protect, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: "Usuário não encontrado" });

    const hoje = new Date();
    const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), 17);

    if (hoje.getDate() < 10) {
      return res.status(400).json({
        success: false,
        error: "A fatura só pode ser paga a partir do dia 10 deste mês.",
      });
    }

    const valorFatura = Number(user.faturaAtual || 0);
    if (valorFatura <= 0) return res.status(400).json({ success: false, error: "Não há fatura aberta." });
    if (user.saldo < valorFatura) return res.status(400).json({ success: false, error: "Saldo insuficiente para pagar a fatura." });

    // Cria transação
    const tx = await Transaction.create({
      usuario: user._id,
      tipo: "pagamento_fatura",
      valor: -valorFatura,
      descricao: "Pagamento da fatura mensal",
      data: hoje,
      status: "concluido",
      tipoOperacao: "debito",
    });

    // Atualiza saldo e fatura
    user.saldo -= valorFatura;
    user.faturaAtual = 0;

    // Histórico da fatura
    user.historicoFatura.push({
      valor: valorFatura,
      data: hoje,
      tipoOperacao: "debito",
      descricao: "Pagamento da fatura",
    });

    await user.save();

    res.json({ success: true, message: "Fatura paga com sucesso.", transaction: tx });
  } catch (err) {
    console.error("Erro ao pagar fatura:", err);
    res.status(500).json({ success: false, error: "Erro ao pagar fatura." });
  }
});

// 💰 ANTECIPAR FATURA
router.post("/faturas/antecipar", protect, anteciparFatura); // Mantido via controller já corrigido

// 📄 GERAR PDF DA FATURA
router.post("/fatura/pdf", protect, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

    // Busca apenas transações de crédito válidas
    const creditos = await Transaction.find({
      usuario: user._id,
      tipoOperacao: "credito",
      valor: { $gt: 0 },
    }).sort({ data: 1 }).lean();

    const valorFatura = creditos.reduce((sum, tx) => sum + Number(tx.valor || 0), 0);
    const hoje = new Date();
    const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), 17);

    // Linha digitável e QR code
    const linhaDigitavel = "34191.79001 01043.510047 91020.150008 8 12340000050000";
    const qrData = `Pagamento ${user.nome} - R$ ${valorFatura.toFixed(2)} - Vencimento: ${vencimento.toLocaleDateString("pt-BR")}`;
    const qrBuffer = await QRCode.toBuffer(qrData);

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: linhaDigitavel,
      scale: 3,
      height: 50,
      includetext: false,
      textxalign: 'center',
    });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=fatura_${user.nome}.pdf`);
    doc.pipe(res);

    // === Cabeçalho ===
    const logoPath = path.resolve("frontend/assets/images/vascobank_logo.png");
    if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 40, { width: 100 });

    doc.fillColor("#ff6600").fontSize(22).text("VASCOBANK S.A.", 160, 45);
    doc.fontSize(10).fillColor("#000")
      .text("CNPJ: 12.345.678/0001-90", 160, 70)
      .text("Av. Central, 1000 - Rio de Janeiro/RJ", 160, 85);

    doc.moveDown(2);

    // === Dados do usuário ===
    doc.fontSize(12).fillColor("#000");
    doc.text(`Nome: ${user.nome}`, 40);
    doc.text(`CPF: ${user.cpf}`, 40);
    doc.text(`Conta: ${user.numeroConta}`, 40);

    // === Resumo da fatura ===
    doc.fillColor("#ff6600").fontSize(14).text("Resumo da Fatura", 40, doc.y + 10);
    doc.fontSize(12).fillColor("#000");
    doc.text(`Data de Vencimento: ${vencimento.toLocaleDateString("pt-BR")}`, 40);
    doc.text(`Valor Total: R$ ${valorFatura.toFixed(2)}`, 40);
    doc.text(`Pagamento Mínimo: R$ ${(valorFatura * 0.15).toFixed(2)}`, 40);
    doc.text(`Limite Disponível: R$ ${(user.limiteCredito - (user.creditoUsado || 0)).toFixed(2)}`, 40);

    // === Lançamentos (apenas créditos) ===
    doc.fillColor("#ff6600").fontSize(14).text("Lançamentos", 40, doc.y + 10);
    let y = doc.y + 10;
    doc.fontSize(10).fillColor("#000");

    // Cabeçalho da tabela
    doc.rect(40, y - 5, 510, 20).fill("#ff6600").fillColor("#fff");
    doc.text("DATA", 45, y);
    doc.text("DESCRIÇÃO", 120, y);
    doc.text("TIPO", 400, y);
    doc.text("VALOR (R$)", 480, y, { align: "right" });
    doc.fillColor("#000");
    y += 25;

    creditos.forEach((item, i) => {
      const bgColor = i % 2 === 0 ? "#f7f7f7" : "#ffffff";
      doc.rect(40, y - 2, 510, 20).fill(bgColor).fillColor("#000");
      const data = item.data ? new Date(item.data).toLocaleDateString("pt-BR") : "-";
      const descricao = item.descricao || "Sem descrição";
      const tipo = (item.tipoOperacao || "credito").toUpperCase();
      const valor = Number(item.valor || 0).toFixed(2);

      doc.text(data, 45, y);
      doc.text(descricao, 120, y, { width: 270 });
      doc.text(tipo, 400, y);
      doc.text(valor, 480, y, { align: "right" });
      y += 20;
      if (y > 580) { doc.addPage(); y = 50; }
    });

    y += 30;
    doc.image(qrBuffer, 40, y, { width: 100 });
    doc.image(barcodeBuffer, 200, y + 5, { width: 300, height: 50 });
    doc.text(`Linha Digitável: ${linhaDigitavel}`, 40, y + 60);

    doc.end();
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).json({ message: "Erro ao gerar PDF.", error: err.message });
  }
});

export default router;
