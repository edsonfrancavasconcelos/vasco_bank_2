import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { pagarFatura, gerarFaturaPDF } from "../controllers/faturaController.js";
import { anteciparFatura } from "../controllers/transactionController.js";
import Fatura from "../models/Fatura.js";
import Transaction from "../models/Transaction.js";
import Usuario from "../models/Usuario.js";

const router = express.Router();

// =====================
// Rota para obter fatura atual
// =====================
router.get("/atual", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Busca fatura aberta
    let fatura = await Fatura.findOne({ usuario: userId, status: "aberta" });

    if (!fatura) {
      // Cria fatura se não existir
      fatura = await Fatura.create({
        usuario: userId,
        valor: 0,
        status: "aberta",
        descricao: "Fatura aberta",
        data: new Date(),
      });
    }

    // Soma todas transações de débito concluídas vinculadas à fatura
    const transacoesDebito = await Transaction.find({
      usuario: userId,
      faturaId: fatura._id,
      tipoOperacao: "debito",
      status: "concluida",
    });

    const totalDebito = transacoesDebito.reduce((acc, tx) => acc + (Number(tx.valor) || 0), 0);

    // Atualiza valor da fatura
    fatura.valor = totalDebito;
    await fatura.save();

    // Atualiza faturaAtual do usuário
    const usuario = await Usuario.findById(userId);
    if (usuario) {
      usuario.faturaAtual = fatura.valor;
      await usuario.save();
    }

    res.json({
      success: true,
      faturaId: fatura._id,
      valor: fatura.valor.toFixed(2),
      status: fatura.status,
      saldoUsuario: usuario?.saldo.toFixed(2) || 0,
    });
  } catch (err) {
    console.error("Erro ao buscar fatura atual:", err);
    res.status(500).json({ success: false, error: "Erro ao buscar fatura atual" });
  }
});

// =====================
// Outras rotas
// =====================
router.post("/pagar", protect, pagarFatura);
router.post("/antecipar", protect, anteciparFatura);
router.post("/pdf", protect, gerarFaturaPDF);

export default router;
