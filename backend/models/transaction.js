const mongoose = require('mongoose');

const transacaoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // dono da transação
  deUsuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // quem enviou (se aplicável)
  tipo: {
    type: String,
    enum: [
      'enviar_pix',
      'receber_pix',
      'cobrar_pix',
      'leitura_qrcode',
      'agendamento_pix',
      'recarga_celular',
      'recarga', // agora aceita também "recarga"
      'deposito',
      'pagamento_boleto',
      'transferencia',
    ],
    required: true,
  },
  chave: { type: String }, // chave Pix ou referência da transação
  tipoChavePara: { type: String }, // email, cpf, celular, aleatoria etc
  valor: { type: Number, required: true },
  descricao: { type: String, default: '' },
  status: { type: String, default: 'pendente' }, // pendente, enviado, recebido, confirmado etc
  data: { type: Date, default: Date.now },
  dataAgendamento: { type: Date }, // só para agendados
  nomeRecebedor: { type: String },
  cidade: { type: String },
  pais: { type: String },
  mcc: { type: String },

  // Campos adicionais para tipos específicos
  boletoCodigo: { type: String },       // pagamento de boleto
  contaDestino: { type: String },       // depósito e transferência
  numeroCelular: { type: String },      // recarga de celular
});

module.exports = mongoose.model('Transaction', transacaoSchema);
