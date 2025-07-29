const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  fromAccount: { type: String },
  targetAccount: { type: String },
  description: { type: String },
  installments: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  operator: { type: String, enum: ['vivo', 'claro', 'tim', 'oi'] },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
});

module.exports = mongoose.model("Transaction", transactionSchema);