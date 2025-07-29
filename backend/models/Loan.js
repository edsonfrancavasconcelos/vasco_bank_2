// backend/models/Loan.js
const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['personal', 'property', 'vehicle', 'consigned'], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  term: { type: Number, required: true, min: 1 },
  interestRate: { type: Number, default: 0.05, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'active', 'paid'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Loan', loanSchema);