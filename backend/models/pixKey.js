const mongoose = require('mongoose');

const pixKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['cpf', 'email', 'phone', 'random'], required: true },
  value: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PixKey', pixKeySchema);