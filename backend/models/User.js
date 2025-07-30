const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Esquema para chave Pix
const pixKeySchema = new mongoose.Schema({
  keyType: { type: String, required: true }, // CPF, EMAIL, PHONE, RANDOM
  key: { type: String, required: true },
});

// Esquema de usuário
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true },
  rg: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  accountNumber: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  pixKeys: { type: [pixKeySchema], default: [] },
  createdAt: { type: Date, default: Date.now },

  // Recuperação de senha
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
});

// Índice único parcial para as chaves Pix (evita duplicação global de uma mesma chave)
userSchema.index(
  { "pixKeys.key": 1 },
  {
    unique: true,
    partialFilterExpression: { "pixKeys.key": { $exists: true, $ne: null } },
  }
);

// Hash da senha antes de salvar
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Método para comparar senha fornecida com hash armazenado
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
