const mongoose = require('mongoose');
const CardSchema = new mongoose.Schema({
  tipo: { type: String, required: true, enum: ['fisico', 'virtual'] },
  emailUsuario: { type: String, required: true },
  nomeTitular: { type: String },
  numero: { type: String },
  cvv: { type: String },
  validade: { type: String },
  criadoEm: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Card', CardSchema);