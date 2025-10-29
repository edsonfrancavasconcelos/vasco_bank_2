import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { anteciparFatura } from "../controllers/transactionController.js";
import { gerarFaturaPDF } from "../controllers/faturaController.js"; // ← função real criada abaixo
import Fatura from "../models/Fatura.js";
import Transaction from "../models/Transaction.js";
import Usuario from "../models/Usuario.js";

const router = express.Router();

// Função auxiliar para obter o mês de referência atual (ex.: "2025-10")
function getMesReferencia() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Função auxiliar para recalcular a fatura
async function recalcularFatura(usuarioId, fatura) {
  try {
    console.log(`[recalcularFatura] Calculando fatura ${fatura._id} para usuário: ${usuarioId}`);

    // Busca transações associadas à fatura
    const transacoes = await Transaction.find({
      usuario: usuarioId,
      faturaId: fatura._id,
      status: "concluida"
    });

    let totalDebito = 0;
    let totalCredito = 0;

    transacoes.forEach(tx => {
      console.log(`[recalcularFatura] Transação: ${tx.tipo}, valor: ${tx.valor}, tipoOperacao: ${tx.tipoOperacao}`);
      if (tx.tipoOperacao === "debito" && tx.tipo !== "antecipacao") {
        totalDebito += Math.abs(Number(tx.valor || 0));
      }
      if (tx.tipo === "pagamento_boleto" || tx.tipo === "antecipacao" || tx.tipo === "recarga") {
        totalCredito += Math.abs(Number(tx.valor || 0));
      }
    });

    // Calcula o valor líquido da fatura (débitos - créditos)
    fatura.valorTotal = Math.max(totalDebito - totalCredito, 0);
    fatura.status = fatura.valorTotal > 0 ? "aberta" : "paga";
    if (fatura.status === "paga") fatura.dataPagamento = new Date();
    await fatura.save();

    // Atualiza faturaAtual no usuário
    const usuario = await Usuario.findById(usuarioId);
    if (usuario) {
      usuario.faturaAtual = fatura.valorTotal;
      usuario.saldoAtual = usuario.saldo;
      await usuario.save();
      console.log(`[recalcularFatura] Usuário atualizado: faturaAtual=${fatura.valorTotal}, saldo=${usuario.saldo}`);
    }

    console.log(`[recalcularFatura] Fatura atualizada: valorTotal=${fatura.valorTotal}, status=${fatura.status}`);
    return fatura;
  } catch (err) {
    console.error("[recalcularFatura] Erro:", err);
    throw err;
  }
}

// Rota: /api/fatura/credito
router.get("/credito", protect, async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const mesReferencia = getMesReferencia();

    let fatura = await Fatura.findOne({ usuario: usuarioId, mesReferencia, status: "aberta" });

    if (!fatura) {
      console.log(`[fatura/credito] Nenhuma fatura aberta encontrada, criando nova...`);
      fatura = await Fatura.create({
        usuario: usuarioId,
        mesReferencia,
        status: "aberta",
        valorTotal: 0,
        dataVencimento: new Date(new Date().setDate(new Date().getDate() + 30))
      });
    }

    await recalcularFatura(usuarioId, fatura);

    const transacoes = await Transaction.find({
      usuario: usuarioId,
      faturaId: fatura._id,
      status: "concluida"
    });

    const respostaFormatada = [
      {
        tipo: "fatura_aberta",
        valor: fatura.valorTotal,
        status: fatura.status,
        data: fatura.createdAt,
        dataVencimento: fatura.dataVencimento
      },
      ...transacoes.map(tx => ({
        tipo: tx.tipo,
        tipoOperacao: tx.tipoOperacao,
        valor: Number(tx.valor || 0),
        descricao: tx.descricao || `${tx.tipoOperacao === "credito" ? "Crédito" : "Débito"}`,
        status: tx.status,
        data: tx.createdAt,
        saldoAtual: Number(tx.saldoAtual || 0)
      }))
    ];

    res.json({ success: true, data: respostaFormatada });
  } catch (err) {
    console.error("[fatura/credito] Erro:", err);
    res.status(500).json({ success: false, message: "Erro interno ao buscar fatura", error: err.message });
  }
});

// Rota: /api/fatura/pagar
router.post("/pagar", protect, async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const { valor, faturaId, metodoPagamento } = req.body;

    if (!faturaId || !valor || !metodoPagamento) {
      return res.status(400).json({ success: false, message: "Fatura, valor e método de pagamento são obrigatórios." });
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(404).json({ success: false, message: "Usuário não encontrado" });

    const fatura = await Fatura.findOne({ _id: faturaId, usuario: usuarioId, status: "aberta" });
    if (!fatura) return res.status(404).json({ success: false, message: "Fatura não encontrada ou já paga" });

    const valorPago = Math.min(Number(valor), fatura.valorTotal, metodoPagamento === "saldo" ? usuario.saldo : Infinity);
    if (valorPago <= 0) return res.status(400).json({ success: false, message: "Saldo insuficiente ou valor inválido" });

    const transacao = await Transaction.create({
      usuario: usuarioId,
      tipo: "pagamento_boleto",
      descricao: `Pagamento de boleto: R$ ${valorPago.toFixed(2)}`,
      valor: valorPago,
      tipoOperacao: "credito",
      status: "concluida",
      nomeRemetente: usuario.nome,
      nomeRecebedor: "Cartão de Crédito",
      data: new Date(),
      taxa: 0,
      saldoAtual: metodoPagamento === "saldo" ? usuario.saldo - valorPago : usuario.saldo,
      faturaId: fatura._id
    });

    if (metodoPagamento === "saldo") {
      usuario.saldo -= valorPago;
      usuario.saldoAtual = usuario.saldo;
      await usuario.save();
    }

    await recalcularFatura(usuarioId, fatura);

    res.status(200).json({
      success: true,
      mensagem: "Pagamento realizado com sucesso!",
      faturaRestante: fatura.valorTotal.toFixed(2),
      novoSaldo: usuario.saldo.toFixed(2)
    });
  } catch (err) {
    console.error("[fatura/pagar] Erro:", err);
    res.status(500).json({ success: false, message: "Erro interno ao pagar fatura", error: err.message });
  }
});

// Rota: /api/fatura/atual
router.get("/atual", protect, async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const mesReferencia = getMesReferencia();

    let fatura = await Fatura.findOne({ usuario: usuarioId, mesReferencia, status: "aberta" });

    if (!fatura) {
      fatura = await Fatura.create({
        usuario: usuarioId,
        mesReferencia,
        status: "aberta",
        valorTotal: 0,
        dataVencimento: new Date(new Date().setDate(new Date().getDate() + 30))
      });
    }

    await recalcularFatura(usuarioId, fatura);

    const transacoes = await Transaction.find({
      usuario: usuarioId,
      faturaId: fatura._id,
      status: "concluida"
    });

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) throw new Error("Usuário não encontrado");

    res.json({
      success: true,
      data: {
        id: fatura._id,
        fatura: fatura.valorTotal,
        status: fatura.status,
        data: fatura.createdAt,
        dataVencimento: fatura.dataVencimento,
        saldo: usuario.saldo,
        transacoes
      }
    });
  } catch (err) {
    console.error("[fatura/atual] Erro:", err);
    res.status(500).json({ success: false, message: "Erro interno ao buscar fatura atual", error: err.message });
  }
});

// Outras rotas
router.post("/antecipar", protect, anteciparFatura);

// 🔹 só registra a rota PDF se a função existir
if (typeof gerarFaturaPDF === "function") {
  router.post("/pdf", protect, gerarFaturaPDF);
}

export default router;
