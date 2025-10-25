import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Schema para histórico (saldo e fatura)
const historicoSchema = new mongoose.Schema(
  {
    data: { type: Date, required: true, default: Date.now },
    descricao: { type: String, required: true },
    valor: { type: Number, required: true },
    tipoOperacao: { type: String, enum: ["debito", "credito"], default: "debito" },
  },
  { _id: false }
);

const usuarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    cpf: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{11}$/.test(v),
        message: "CPF deve conter exatamente 11 dígitos",
      },
    },
    telefone: { type: String, trim: true },
    endereco: { type: String, trim: true },
    senha: { type: String, required: true },
    numeroConta: { type: String, required: true, unique: true, trim: true },

    saldo: { type: Number, default: 0, min: 0 },
    historicoSaldo: { type: [historicoSchema], default: [] },

    limiteCredito: { type: Number, default: 5000 },
    creditoUsado: { type: Number, default: 0 },
    faturaAtual: { type: Number, default: 0, min: 0 },
    historicoFatura: { type: [historicoSchema], default: [] },

    chavesPix: [
      {
        tipo: { type: String, enum: ["celular", "cpf", "email", "aleatoria"], required: true },
        valor: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Middleware: hash da senha antes de salvar
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) return next();

  try {
    const saltRounds = 10;
    this.senha = await bcrypt.hash(this.senha, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar senha com hash armazenado
usuarioSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.senha);
};

// Método utilitário para atualizar saldo/fatura
usuarioSchema.methods.atualizarSaldo = async function ({ valor, tipoOperacao, descricao }) {
  valor = Number(valor);
  if (isNaN(valor) || valor <= 0) throw new Error("Valor inválido");

  const entry = {
    data: new Date(),
    descricao: descricao || "Operação",
    valor,
    tipoOperacao: tipoOperacao === "credito" ? "credito" : "debito",
  };

  if (tipoOperacao === "debito") {
    const limiteDisponivel = this.saldo + (this.limiteCredito - this.creditoUsado);
    if (valor > limiteDisponivel) throw new Error("Saldo e crédito insuficientes");

    // Debita primeiro do saldo, depois do crédito usado
    if (this.saldo >= valor) {
      this.saldo -= valor;
    } else {
      const restante = valor - this.saldo;
      this.saldo = 0;
      this.creditoUsado += restante;
    }
    this.faturaAtual = Math.max(0, this.faturaAtual - valor);
  } else if (tipoOperacao === "credito") {
    this.saldo += valor;
    this.creditoUsado = Math.max(0, this.creditoUsado - valor);
    this.faturaAtual += valor;
  }

  this.historicoSaldo.push(entry);
  this.historicoFatura.push({ ...entry });

  await this.save();
  return this;
};

export default mongoose.model("Usuario", usuarioSchema);
