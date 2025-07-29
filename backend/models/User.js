const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const pixKeySchema = new mongoose.Schema({
  keyType: { type: String, required: true }, // "CPF", "EMAIL", "PHONE", "RANDOM"
  key: { type: String, required: true }, // Sem unique aqui, o índice composto cuida disso
});

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cpf: { type: String, required: true, unique: true },
  rg: { type: String, required: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  accountNumber: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  pixKeys: { type: [pixKeySchema], default: [] }, // Array de chaves Pix com default vazio
  createdAt: { type: Date, default: Date.now },

  // Campos para recuperação de senha:
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
});

// Índice único parcial pra pixKeys.key, ignorando null/undefined
userSchema.index(
  { "pixKeys.key": 1 },
  {
    unique: true,
    partialFilterExpression: { "pixKeys.key": { $exists: true, $ne: null } },
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    console.log("Hashing password para:", this.email);
    this.password = await bcrypt.hash(this.password, 10);
    console.log("Senha hasheada:", this.password);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
