// models/Emprestimo.js
import mongoose from 'mongoose';

const emprestimoSchema = new mongoose.Schema({
  userId: String,
  tipo: String, // 'trabalhador', 'consignado', 'pessoal'
  valor: Number,
  parcelas: Number,
  juros: Number,
  simulacao: Boolean,
  criadoEm: { type: Date, default: Date.now }
});

export default mongoose.model('Emprestimo', emprestimoSchema);
