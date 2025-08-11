// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Schema para o histórico de transações
const historicoSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  descricao: { type: String, required: true },
  valor: { type: Number, required: true }
});

// Schema principal do usuário
const usuarioSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  cpf: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    validate: {
      validator: function (v) {
        return /^\d{11}$/.test(v); // Valida CPF com 11 dígitos
      },
      message: 'CPF deve conter exatamente 11 dígitos'
    }
  },
  telefone: { 
    type: String, 
    trim: true 
  },
  endereco: { 
    type: String, 
    trim: true 
  },
  senha: { 
    type: String, 
    required: true 
  },
  numeroConta: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  saldo: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  fatura: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  historicoFatura: [historicoSchema],
  historicoSaldo: [historicoSchema]
}, { 
  timestamps: true 
});

// Middleware para hashear a senha
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar senhas
usuarioSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.senha);
};


// Exporta o modelo
module.exports = mongoose.model('Usuario', usuarioSchema);