const express = require("express");
const router = express.Router();
const auth = require("../auth");

router.get("/:accountId", auth, async (req, res) => {
  // Lógica para buscar extrato no banco de dados
  const statement = [
    { date: new Date(), description: "Saque", amount: -200.0 },
    { date: new Date(), description: "Depósito", amount: 1000.0 },
  ]; // Exemplo estático
  res.status(200).json(statement);
});

module.exports = router;
