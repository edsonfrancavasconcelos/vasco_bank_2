// backend/models/PixUsuario.js
import mongoose from 'mongoose';

const chaveSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ["cpf", "email", "telefone", "aleatoria", "cnpj"],
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
    ref: "Usuario", // Corrigido de 'User' para 'Usuario'
    unique: true,
    required: true,
  },
  chaves: {
    type: [chaveSchema],
    default: [],
  },
});

export default mongoose.model("PixUsuario", pixUsuarioSchema);
