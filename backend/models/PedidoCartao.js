// backend/models/PedidoCartao.js
const mongoose = require('mongoose');

const pedidoCartaoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  motivo: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PedidoCartao', pedidoCartaoSchema);
