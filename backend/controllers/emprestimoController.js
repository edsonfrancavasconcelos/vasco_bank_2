const Emprestimo = require('../models/Emprestimo');

exports.simular = (req, res) => {
  const { tipo, valor, parcelas } = req.body;
  const juros = tipo === 'pessoal' ? 0.08 : tipo === 'consignado' ? 0.04 : 0.02;
  const total = valor * (1 + juros);
  const parcela = total / parcelas;

  res.json({
    tipo,
    valor,
    parcelas,
    juros: juros * 100 + '%',
    parcela: parcela.toFixed(2),
    total: total.toFixed(2)
  });
};
