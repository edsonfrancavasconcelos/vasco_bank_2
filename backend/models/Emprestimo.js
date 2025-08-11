const mongoose = require('mongoose');

const emprestimoSchema = new mongoose.Schema({
  userId: String,
  tipo: String, // 'trabalhador', 'consignado', 'pessoal'
  valor: Number,
  parcelas: Number,
  juros: Number,
  simulacao: Boolean,
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Emprestimo', emprestimoSchema);
