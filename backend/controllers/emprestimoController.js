// backend/controllers/emprestimoController.js

// ------------------- Controller -------------------
export const simularEmprestimo = (req, res) => {
  const { tipo, valor, parcelas } = req.body;

  // Define taxa de juros com base no tipo de empréstimo
  const juros = tipo === "pessoal" 
    ? 0.08 
    : tipo === "consignado" 
    ? 0.04 
    : 0.02;

  const total = valor * (1 + juros);
  const parcela = total / parcelas;

  res.json({
    tipo,
    valor,
    parcelas,
    juros: (juros * 100).toFixed(2) + "%",
    parcela: parcela.toFixed(2),
    total: total.toFixed(2),
  });
};
