import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },

  tipo: { 
    type: String, 
    enum: [
      'compra',
      'pagamento_boleto',
      'transferencia',
      'recarga',
      'deposito',
      'pagar_fatura',
      'pagar_minimo',
      'antecipacao',
      'antecipacao_fatura', 
      'juros',
      'estorno'
    ], 
    required: true 
  },

  descricao: { type: String, default: '' },
  valor: { type: Number, required: true },
  taxa: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pendente', 'concluida', 'cancelada'], 
    default: 'pendente' 
  },
  tipoOperacao: { 
    type: String, 
    enum: ['credito', 'debito'], 
    required: true 
  },

  // Parcelamento
  parcelado: { type: Boolean, default: false },
  numeroParcelas: { type: Number, default: 1 },
  parcelaAtual: { type: Number, default: 1 },
  valorParcela: { type: Number },
  juros: { type: Number, default: 0 },

  // Integração com Fatura
  fatura: { type: mongoose.Schema.Types.ObjectId, ref: 'Fatura' },

  // Relações entre transações
  referenciaFatura: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  parcelasVinculadas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],

  // Dados adicionais
  contaOrigem: { type: String },
  contaDestino: { type: String },
  operador: { type: String },
  numeroCelular: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },

  nomeRemetente: { type: String, default: 'N/A' },
  nomeRecebedor: { type: String, default: 'N/A' },

  data: { type: Date, default: Date.now }

}, { timestamps: true });

// =========================
// MÉTODOS ESTÁTICOS
// =========================

// Cria parcelas de uma compra
TransactionSchema.statics.criarParcelas = async function({ usuarioId, valorTotal, numeroParcelas, descricao, faturaId }) {
  const valorParcela = valorTotal / numeroParcelas;
  const parcelas = [];

  for (let i = 1; i <= numeroParcelas; i++) {
    const tx = await this.create({
      usuario: usuarioId,
      tipo: 'compra',
      descricao: `${descricao} (parcela ${i}/${numeroParcelas})`,
      valor: valorParcela,
      numeroParcelas,
      parcelaAtual: i,
      parcelado: true,
      tipoOperacao: 'credito',
      status: 'pendente',
      fatura: faturaId
    });
    parcelas.push(tx);
  }

  // Vincula parcelas entre si
  for (const p of parcelas) {
    p.parcelasVinculadas = parcelas.map(pp => pp._id);
    await p.save();
  }

  return parcelas;
};

// Vincula uma transação existente a uma fatura
TransactionSchema.statics.vincularAFatura = async function(transactionId, faturaId) {
  const tx = await this.findById(transactionId);
  if (!tx) throw new Error("Transação não encontrada");

  tx.fatura = faturaId;
  await tx.save();
  return tx;
};

// =========================
// MÉTODOS DE INSTÂNCIA
// =========================

// Marca como concluída
TransactionSchema.methods.concluir = async function() {
  this.status = 'concluida';
  await this.save();
  return this;
};

// Cancela a transação
TransactionSchema.methods.cancelar = async function() {
  this.status = 'cancelada';
  await this.save();
  return this;
};

// Recalcula o valor total de uma fatura com base nas transações vinculadas
TransactionSchema.statics.recalcularFatura = async function(faturaId) {
  const total = await this.aggregate([
    { $match: { fatura: mongoose.Types.ObjectId(faturaId), status: { $ne: 'cancelada' } } },
    { $group: { _id: null, soma: { $sum: '$valor' } } }
  ]);
  return total[0]?.soma || 0;
};


console.log('✅ Modelo Transaction atualizado com integração de faturas sem criar faturas como operação');
export default mongoose.model('Transaction', TransactionSchema);
