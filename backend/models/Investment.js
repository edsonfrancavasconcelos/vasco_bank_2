const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['fixed_income', 'stocks', 'funds', 'crypto'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  returnRate: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Atualiza `updatedAt` ao salvar
investmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Investment', investmentSchema);