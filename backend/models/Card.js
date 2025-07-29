const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: { type: String, required: true },
  email: { type: String },
  rg: { type: String, required: true },
  cpf: { type: String, required: true },
  address: { type: String },
  cardPassword: { type: String, required: true },
  lastFour: { type: String, required: true },
  cvv: { type: String, required: true },
  expiry: { type: String, required: true },
  limit: { type: Number, required: true },
  invoice: { type: Number, default: 0 }, // Novo campo para fatura
  type: { type: String, enum: ["virtual", "physical"], default: "physical" },
  virtualType: { type: String, enum: ['single-use', 'multi-use'], default: 'multi-use' },
  status: { type: String, enum: ["pending", "active", "blocked"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

cardSchema.pre("save", async function (next) {
  if (this.isModified("cardPassword")) {
    this.cardPassword = await bcrypt.hash(this.cardPassword, 10);
  }
  next();
});

module.exports = mongoose.model("Card", cardSchema);