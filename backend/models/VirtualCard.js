const mongoose = require('mongoose');

const virtualCardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    default: 'Titular Padrão'
  },
  type: {
    type: String,
    required: true,
    enum: ['single-use', 'multi-use']
  },
  limit: {
    type: Number,
    required: true,
    min: 0
  },
  brand: {
    type: String,
    default: 'Visa',
    enum: ['Visa', 'Mastercard', 'Amex']
  },
  number: {
    type: String,
    required: true,
    match: /^(\*{4}\s){3}\d{4}$|^(\d{4}\s){3}\d{4}$/
  },
  expiry: {
    type: String,
    required: true,
    match: /^\d{2}\/\d{2}$/
  },
  cvv: {
    type: String,
    required: true,
    match: /^\d{3}$/
  },
  logo: {
    type: String,
    default: 'vbank'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive', 'blocked']
  }
});

module.exports = mongoose.model('VirtualCard', virtualCardSchema);