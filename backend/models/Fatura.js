// backend/models/Fatura.js
import mongoose from 'mongoose';

const faturaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  valor: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['aberta', 'aguardando_pagamento', 'paga', 'atrasada'],
    default: 'aberta'
  },
  dataCriacao: { type: Date, default: Date.now },
  dataVencimento: { type: Date, required: true },
  dataPagamento: { type: Date },
  descricao: { type: String, default: 'Fatura mensal VascoBank' }
});

export default mongoose.model('Fatura', faturaSchema);
