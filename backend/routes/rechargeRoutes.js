

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");

// Rota para realizar recarga de celular para um usuário autenticado.
router.post("/", auth, async (req, res) => {
    const { phoneNumber, amount } = req.body;
    const userId = req.user._id;

    // Validação de entrada
    if (!phoneNumber || !amount || amount <= 0) {
        return res.status(400).json({ error: "Número de telefone e valor da recarga são obrigatórios." });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        if (user.balance < amount) {
            return res.status(400).json({ error: "Saldo insuficiente." });
        }

        // Início da transação (opcional, mas recomendado)
        // ... (Implementar lógica de transação se necessário)

        user.balance -= amount;
        await user.save();

        const transaction = new Transaction({
            accountId: user._id,
            type: "Recarga de Celular",
            amount: -amount,
            details: `Recarga para ${phoneNumber}`,
        });
        await transaction.save();

        // Fim da transação (opcional, mas recomendado)
        // ... (Implementar lógica de transação se necessário)

        res.status(200).json({ message: "Recarga realizada com sucesso!" });
    } catch (error) {
        console.error("Erro ao realizar recarga:", error);
        res.status(500).json({ error: "Erro ao realizar recarga." });
    }
});

module.exports = router;