<<<<<<< HEAD
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
=======
import express from 'express';
import mongoose from 'mongoose';
import Usuario from '../models/Usuario.js';
import Transaction from '../models/Transaction.js';
import { registerUser, loginUser, resetSenha } from '../controllers/userController.js';
import { anteciparFatura } from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import fs from 'fs-extra';
import path from 'path';
import QRCode from 'qrcode';
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

const router = express.Router();

// 🔓 ROTAS PÚBLICAS
<<<<<<< HEAD
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
=======
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/reset', resetSenha);
router.post('/reset-password', resetSenha);
router.post('/logout', (req, res) => res.json({ message: 'Logout realizado com sucesso' }));

// 🔒 ROTAS PROTEGIDAS

router.get('/me', protect, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user._id);
    if (!user) {
      console.log('Usuário não encontrado:', req.user._id);
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    // Busca fatura aberta
    let fatura = await Transaction.findOne({
      usuario: user._id,
      tipo: 'fatura_aberta',
      status: { $in: ['pendente', 'atrasada'] },
    }).sort({ createdAt: -1 });

    console.log('Fatura encontrada em /me:', fatura ? fatura : 'Nenhuma fatura encontrada');

    // Calcula o valor da fatura com base em transações de débito
    const hoje = new Date();
    const transacoesDebito = await Transaction.find({
      usuario: user._id,
      tipoOperacao: 'debito',
      status: 'concluida',
      tipo: { $nin: ['antecipacao', 'pagamento_fatura', 'pagamento_fatura_atrasada'] },
      createdAt: { $gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1) },
    });

    let totalDebito = 0;
    transacoesDebito.forEach((tx) => {
      totalDebito += Math.abs(Number(tx.valor));
    });
    console.log('Total de débitos para usuarioId:', user._id, 'é:', totalDebito);

    const valorFatura = totalDebito > 0 ? totalDebito : Number(user.faturaAtual || 0);

    // Cria ou atualiza a fatura
    if (!fatura && valorFatura > 0) {
      console.log('Criando nova fatura para usuarioId:', user._id);
      fatura = await Transaction.create({
        usuario: user._id,
        tipo: 'fatura_aberta',
        descricao: 'Fatura aberta',
        valor: valorFatura,
        tipoOperacao: 'credito',
        status: 'pendente',
        mes: hoje.getMonth() + 1,
        ano: hoje.getFullYear(),
        createdAt: hoje,
      });
    } else if (fatura && fatura.valor !== valorFatura) {
      console.log('Atualizando valor da fatura:', fatura._id);
      fatura.valor = valorFatura;
      fatura.status = 'pendente';
      await fatura.save();
    }

    // Sincroniza user.faturaAtual
    user.faturaAtual = fatura && fatura.status !== 'concluida' ? valorFatura : 0;
    await user.save();

    const dataVencimentoFatura = fatura
      ? new Date(fatura.ano || hoje.getFullYear(), (fatura.mes || hoje.getMonth() + 1) - 1, 30)
      : new Date(hoje.getFullYear(), hoje.getMonth(), 30);
    const statusFatura = fatura ? (fatura.status === 'pendente' ? 'aberta' : fatura.status) : valorFatura > 0 ? 'aberta' : 'nenhuma';
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

    res.json({
      success: true,
      data: {
        nome: user.nome,
        numeroConta: user.numeroConta,
        saldo: Number(user.saldo || 0),
<<<<<<< HEAD
        fatura: Number(user.faturaAtual || 0),
=======
        fatura: valorFatura,
        faturaId: fatura ? fatura._id.toString() : '',
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
        limiteDisponivel: Number(user.limiteCredito - (user.creditoUsado || 0)),
        dataVencimentoFatura,
        statusFatura,
      },
    });
  } catch (err) {
<<<<<<< HEAD
    console.error("Erro em /me:", err);
    res.status(500).json({ success: false, message: "Erro ao buscar dados do usuário." });
=======
    console.error('Erro em /me:', {
      message: err.message,
      stack: err.stack,
      usuarioId: req.user._id,
    });
    res.status(500).json({ success: false, message: 'Erro ao buscar dados do usuário.' });
  }
});
// ✅ Lista faturas do usuário
router.get('/faturas', protect, async (req, res) => {
  try {
    const faturas = await Transaction.find({
      usuario: req.user._id,
      tipo: 'fatura_aberta',
      status: { $in: ['pendente', 'atrasada', 'concluida'] }, // 'concluida' para histórico
    }).sort({ createdAt: -1 }).lean();

    console.log('Faturas encontradas em /faturas:', faturas);

    const resultado = faturas.map(f => ({
      id: f._id.toString(),
      valor: Number(f.valor || 0),
      status: f.status === 'pendente' ? 'aberta' : f.status,
      dataCriacao: f.createdAt,
      dataVencimento: new Date(f.ano || new Date().getFullYear(), (f.mes || new Date().getMonth() + 1) - 1, 30),
      dataPagamento: f.dataPagamento,
      descricao: f.descricao,
    }));

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ success: true, data: resultado });
  } catch (err) {
    console.error('Erro em /faturas:', {
      message: err.message,
      stack: err.stack,
      usuarioId: req.user._id,
    });
    res.status(500).json({ success: false, error: 'Erro ao listar faturas.' });
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
  }
});

// ✅ Histórico do usuário (créditos e débitos)
<<<<<<< HEAD
router.get("/me/historico", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const tipo = req.query.tipo; // 'credito' ou 'debito'
    const filtro = { usuario: userId };
    if (tipo && ["debito", "credito"].includes(tipo)) filtro.tipoOperacao = tipo;

    const transacoes = await Transaction.find(filtro)
      .sort({ data: -1 })
      .lean();
=======
router.get('/me/historico', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const tipo = req.query.tipo;
    const filtro = { usuario: userId };
    if (tipo && ['debito', 'credito'].includes(tipo)) filtro.tipoOperacao = tipo;

    const transacoes = await Transaction.find(filtro).sort({ data: -1 }).lean();
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

    const resultado = transacoes.map(tx => ({
      _id: tx._id,
      tipo: tx.tipo,
<<<<<<< HEAD
      valor: Number(tx.valor),
      descricao: tx.descricao || "",
      status: tx.status || "concluido",
      data: tx.data,
      tipoOperacao: tx.tipoOperacao || "debito",
      contaOrigem: tx.contaOrigem || "N/A",
      contaDestino: tx.contaDestino || "N/A",
      operador: tx.operador || "N/A",
      numeroCelular: tx.numeroCelular || "N/A",
=======
      valor: Number(tx.valor || 0),
      descricao: tx.descricao || '',
      status: tx.status || 'concluida',
      data: tx.data || tx.createdAt,
      tipoOperacao: tx.tipoOperacao || 'debito',
      contaOrigem: tx.contaOrigem || 'N/A',
      contaDestino: tx.contaDestino || 'N/A',
      operador: tx.operador || 'N/A',
      numeroCelular: tx.numeroCelular || 'N/A',
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    }));

    res.json({ success: true, data: resultado });
  } catch (err) {
<<<<<<< HEAD
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

=======
    console.error('Erro ao buscar histórico:', {
      message: err.message,
      stack: err.stack,
      usuarioId: req.user._id,
    });
    res.status(500).json({ success: false, error: 'Erro ao buscar histórico' });
  }
});

router.post('/transaction/pagar-fatura', protect, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user._id);
    if (!user) {
      console.log('Usuário não encontrado:', req.user._id);
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const hoje = new Date();
    if (hoje.getDate() < 10) {
      return res.status(400).json({
        success: false,
        error: 'A fatura só pode ser paga a partir do dia 10 deste mês.',
      });
    }

    // Busca fatura aberta
    let fatura = await Transaction.findOne({
      usuario: user._id,
      tipo: 'fatura_aberta',
      status: 'pendente',
    }).sort({ createdAt: -1 });

    console.log('Fatura encontrada em /pagar-fatura:', fatura ? fatura : 'Nenhuma fatura encontrada');

    // Calcula o valor da fatura com base em transações de débito
    const transacoesDebito = await Transaction.find({
      usuario: user._id,
      tipoOperacao: 'debito',
      status: 'concluida',
      tipo: { $nin: ['antecipacao', 'pagamento_fatura', 'pagamento_fatura_atrasada'] },
      createdAt: { $gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1) }, // Apenas do mês atual
    });

    let totalDebito = 0;
    transacoesDebito.forEach((tx) => {
      totalDebito += Math.abs(Number(tx.valor));
    });
    console.log('Total de débitos para usuarioId:', user._id, 'é:', totalDebito);

    const valorFatura = totalDebito > 0 ? totalDebito : Number(user.faturaAtual || 0);

    // Se não houver fatura ou o valor estiver errado, cria/atualiza
    if (!fatura && valorFatura > 0) {
      console.log('Criando nova fatura para usuarioId:', user._id);
      fatura = await Transaction.create({
        usuario: user._id,
        tipo: 'fatura_aberta',
        descricao: 'Fatura aberta',
        valor: valorFatura,
        tipoOperacao: 'credito',
        status: 'pendente',
        mes: hoje.getMonth() + 1,
        ano: hoje.getFullYear(),
        createdAt: hoje,
      });
    } else if (fatura && fatura.valor !== valorFatura) {
      console.log('Atualizando valor da fatura:', fatura._id);
      fatura.valor = valorFatura;
      await fatura.save();
    }

    if (valorFatura <= 0) {
      console.log('Nenhuma fatura válida para pagar:', { valorFatura, userFaturaAtual: user.faturaAtual });
      return res.status(400).json({ success: false, error: 'Não há fatura aberta para pagar.' });
    }

    // Verifica saldo
    if (user.saldo < valorFatura) {
      console.log('Saldo insuficiente:', { saldo: user.saldo, valorFatura });
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente para pagar a fatura. Saldo: R$ ${user.saldo.toFixed(2)}, Fatura: R$ ${valorFatura.toFixed(2)}`,
      });
    }

    // Cria transação de pagamento
    const tx = await Transaction.create({
      usuario: user._id,
      tipo: 'pagamento_fatura',
      valor: -valorFatura,
      descricao: 'Pagamento da fatura mensal',
      data: hoje,
      status: 'concluida',
      tipoOperacao: 'debito',
    });

    // Atualiza saldo e fatura no usuário
    user.saldo -= valorFatura;
    user.faturaAtual = 0;

    // Marca fatura como paga
    if (fatura) {
      fatura.status = 'concluida';
      fatura.dataPagamento = hoje;
      await fatura.save();
    }

>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    // Histórico da fatura
    user.historicoFatura.push({
      valor: valorFatura,
      data: hoje,
<<<<<<< HEAD
      tipoOperacao: "debito",
      descricao: "Pagamento da fatura",
=======
      tipoOperacao: 'debito',
      descricao: 'Pagamento da fatura',
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    });

    await user.save();

<<<<<<< HEAD
    res.json({ success: true, message: "Fatura paga com sucesso.", transaction: tx });
  } catch (err) {
    console.error("Erro ao pagar fatura:", err);
    res.status(500).json({ success: false, error: "Erro ao pagar fatura." });
=======
    res.json({
      success: true,
      message: 'Fatura paga com sucesso.',
      transaction: tx,
      saldo: Number(user.saldo || 0),
      faturaAtual: Number(user.faturaAtual || 0),
    });
  } catch (err) {
    console.error('Erro ao pagar fatura:', {
      message: err.message,
      stack: err.stack,
      usuarioId: req.user._id,
    });
    res.status(500).json({ success: false, error: 'Erro ao pagar fatura.' });
  }
});

// 💳 PAGAR FATURA ATRASADA
router.post('/transaction/pagar-fatura-atrasada', protect, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user._id);
    if (!user) {
      console.log('Usuário não encontrado:', req.user._id);
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const fatura = await Transaction.findOne({
      usuario: user._id,
      tipo: 'fatura_aberta',
      status: 'atrasada',
      valor: { $gt: 0 },
    }).sort({ createdAt: -1 });

    const valorFatura = fatura ? Number(fatura.valor || 0) : Number(user.faturaAtual || 0);
    if (valorFatura <= 0) {
      console.log('Nenhuma fatura atrasada encontrada para usuarioId:', user._id);
      return res.status(400).json({ success: false, error: 'Não há fatura atrasada para pagar.' });
    }

    if (user.saldo < valorFatura) {
      return res.status(400).json({ success: false, error: 'Saldo insuficiente para pagar a fatura atrasada.' });
    }

    // Cria transação
    const tx = await Transaction.create({
      usuario: user._id,
      tipo: 'pagamento_fatura_atrasada',
      valor: -valorFatura,
      descricao: 'Pagamento de fatura atrasada',
      data: new Date(),
      status: 'concluida',
      tipoOperacao: 'debito',
    });

    // Atualiza saldo e fatura no usuário
    user.saldo -= valorFatura;
    user.faturaAtual = 0;

    // Marca fatura como paga
    if (fatura) {
      fatura.status = 'concluida';
      fatura.dataPagamento = new Date();
      await fatura.save();
    }

    // Histórico da fatura
    user.historicoFatura.push({
      valor: valorFatura,
      data: new Date(),
      tipoOperacao: 'debito',
      descricao: 'Pagamento de fatura atrasada',
    });

    await user.save();

    res.json({ success: true, message: 'Fatura atrasada paga com sucesso.', transaction: tx });
  } catch (err) {
    console.error('Erro ao pagar fatura atrasada:', {
      message: err.message,
      stack: err.stack,
      usuarioId: req.user._id,
    });
    res.status(500).json({ success: false, error: 'Erro ao pagar fatura atrasada.' });
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
  }
});

// 💰 ANTECIPAR FATURA
<<<<<<< HEAD
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
=======
router.post('/faturas/antecipar', protect, anteciparFatura);

// 📄 GERAR PDF DA FATURA
router.post('/fatura/pdf', protect, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user._id).lean();
    if (!user) {
      console.log('Usuário não encontrado:', req.user._id);
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Busca fatura aberta ou atrasada
    const fatura = await Transaction.findOne({
      usuario: user._id,
      tipo: 'fatura_aberta',
      status: { $in: ['pendente', 'atrasada'] },
      valor: { $gt: 0 },
    }).sort({ createdAt: -1 }).lean();

    // Busca transações de crédito
    const creditos = await Transaction.find({
      usuario: user._id,
      tipoOperacao: 'credito',
      valor: { $gt: 0 },
    }).sort({ data: 1 }).lean();

    const valorFatura = fatura ? Number(fatura.valor || 0) : Number(user.faturaAtual || 0);
    const hoje = new Date();
    const vencimento = fatura
      ? new Date(fatura.ano || hoje.getFullYear(), (fatura.mes || hoje.getMonth() + 1) - 1, 30)
      : new Date(hoje.getFullYear(), hoje.getMonth(), 30);

    // Linha digitável e QR code
    const linhaDigitavel = '34191.79001 01043.510047 91020.150008 8 12340000050000';
    const qrData = `Pagamento ${user.nome} - R$ ${valorFatura.toFixed(2)} - Vencimento: ${vencimento.toLocaleDateString('pt-BR')}`;
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
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
<<<<<<< HEAD
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
=======
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=fatura_${user.nome}.pdf`);
    doc.pipe(res);

    // === Cabeçalho ===
    const logoPath = path.resolve('frontend/assets/images/vascobank_logo.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 40, { width: 100 });

    doc.fillColor('#ff6600').fontSize(22).text('VASCOBANK S.A.', 160, 45);
    doc.fontSize(10).fillColor('#000')
      .text('CNPJ: 12.345.678/0001-90', 160, 70)
      .text('Av. Central, 1000 - Rio de Janeiro/RJ', 160, 85);
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

    doc.moveDown(2);

    // === Dados do usuário ===
<<<<<<< HEAD
    doc.fontSize(12).fillColor("#000");
=======
    doc.fontSize(12).fillColor('#000');
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    doc.text(`Nome: ${user.nome}`, 40);
    doc.text(`CPF: ${user.cpf}`, 40);
    doc.text(`Conta: ${user.numeroConta}`, 40);

    // === Resumo da fatura ===
<<<<<<< HEAD
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
=======
    doc.fillColor('#ff6600').fontSize(14).text('Resumo da Fatura', 40, doc.y + 10);
    doc.fontSize(12).fillColor('#000');
    doc.text(`Data de Vencimento: ${vencimento.toLocaleDateString('pt-BR')}`, 40);
    doc.text(`Valor Total: R$ ${valorFatura.toFixed(2)}`, 40);
    doc.text(`Pagamento Mínimo: R$ ${(valorFatura * 0.15).toFixed(2)}`, 40);
    doc.text(`Limite Disponível: R$ ${(user.limiteCredito - (user.creditoUsado || 0)).toFixed(2)}`, 40);
    if (fatura?.status === 'atrasada') {
      doc.fillColor('#ff0000').text('Status: Atrasada', 40);
    }

    // === Lançamentos (apenas créditos) ===
    doc.fillColor('#ff6600').fontSize(14).text('Lançamentos', 40, doc.y + 10);
    let y = doc.y + 10;
    doc.fontSize(10).fillColor('#000');

    // Cabeçalho da tabela
    doc.rect(40, y - 5, 510, 20).fill('#ff6600').fillColor('#fff');
    doc.text('DATA', 45, y);
    doc.text('DESCRIÇÃO', 120, y);
    doc.text('TIPO', 400, y);
    doc.text('VALOR (R$)', 480, y, { align: 'right' });
    doc.fillColor('#000');
    y += 25;

    creditos.forEach((item, i) => {
      const bgColor = i % 2 === 0 ? '#f7f7f7' : '#ffffff';
      doc.rect(40, y - 2, 510, 20).fill(bgColor).fillColor('#000');
      const data = item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '-';
      const descricao = item.descricao || 'Sem descrição';
      const tipo = (item.tipoOperacao || 'credito').toUpperCase();
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
      const valor = Number(item.valor || 0).toFixed(2);

      doc.text(data, 45, y);
      doc.text(descricao, 120, y, { width: 270 });
      doc.text(tipo, 400, y);
<<<<<<< HEAD
      doc.text(valor, 480, y, { align: "right" });
      y += 20;
      if (y > 580) { doc.addPage(); y = 50; }
=======
      doc.text(valor, 480, y, { align: 'right' });
      y += 20;
      if (y > 580) {
        doc.addPage();
        y = 50;
      }
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    });

    y += 30;
    doc.image(qrBuffer, 40, y, { width: 100 });
    doc.image(barcodeBuffer, 200, y + 5, { width: 300, height: 50 });
    doc.text(`Linha Digitável: ${linhaDigitavel}`, 40, y + 60);

    doc.end();
  } catch (err) {
<<<<<<< HEAD
    console.error("Erro ao gerar PDF:", err);
    res.status(500).json({ message: "Erro ao gerar PDF.", error: err.message });
  }
});

export default router;
=======
    console.error('Erro ao gerar PDF:', {
      message: err.message,
      stack: err.stack,
      usuarioId: req.user._id,
    });
    res.status(500).json({ message: 'Erro ao gerar PDF.', error: err.message });
  }
});

export default router;
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
