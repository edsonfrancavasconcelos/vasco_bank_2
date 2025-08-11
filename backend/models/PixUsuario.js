const mongoose = require('mongoose');

const chaveSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['cpf', 'email', 'telefone', 'aleatoria', 'cnpj'],
    required: true,
  },
  valor: {
    type: String,
    required: true,
  },
});

const pixUsuarioSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  },
  chaves: {
    type: [chaveSchema],
    default: [],
  },
});

module.exports = mongoose.model('PixUsuario', pixUsuarioSchema);
