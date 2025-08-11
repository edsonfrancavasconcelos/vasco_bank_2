const express = require("express");
const router = express.Router();
const { criarTransacao, listarTransacoesComNomes } = require("../controllers/transactionsController");
const { protect } = require("../middleware/authMiddleware"); // middleware que protege rotas

console.log("transactionsController =", { criarTransacao, listarTransacoesComNomes });

// Rota POST recebe o tipo da transação pela URL (:tipo)
router.post("/:tipo", protect, criarTransacao);

// Lista todas as transações do usuário logado
router.get("/", protect, listarTransacoesComNomes);

module.exports = router;
