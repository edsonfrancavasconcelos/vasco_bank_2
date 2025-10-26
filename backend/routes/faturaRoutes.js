import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { pagarFatura, gerarFaturaPDF } from "../controllers/faturaController.js";
import { anteciparFatura } from "../controllers/transactionController.js";
import Fatura from "../models/Fatura.js";
import Transaction from "../models/Transaction.js";
import Usuario from "../models/Usuario.js";

const router = express.Router();

// Fatura atual
router.get("/atual", protect, async (req, res) => { 
  // ... lógica da fatura atual
});

// Fatura crédito
router.get("/credito", protect, async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const fatura = await Fatura.findOne({ usuario: usuarioId, status: "aberta" });

    if (!fatura) return res.status(404).json({ error: "Nenhuma fatura encontrada" });

    const transacoesCredito = await Transaction.find({
      usuario: usuarioId,
      faturaId: fatura._id,
      tipoOperacao: "credito",
      status: "concluida",
    });

    const totalCredito = transacoesCredito.reduce((acc, tx) => acc + (Number(tx.valor) || 0), 0);

    res.json({
      success: true,
      valor: totalCredito,
      status: fatura.status,
      faturaId: fatura._id,
    });
  } catch (err) {
    console.error("Erro ao buscar fatura crédito:", err);
    res.status(500).json({ error: "Erro interno ao buscar fatura" });
  }
});


// =====================
// Outras rotas
// =====================
router.post("/pagar", protect, pagarFatura);
router.post("/antecipar", protect, anteciparFatura);
router.post("/pdf", protect, gerarFaturaPDF);

export default router;
