// backend/models/PedidoCartao.js
import mongoose from 'mongoose';

const pedidoCartaoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  motivo: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
});

export default mongoose.model('PedidoCartao', pedidoCartaoSchema);
