<<<<<<< HEAD
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },

=======
// backend/models/Transaction.js
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  // Tipo da transação
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
  tipo: { 
    type: String, 
    enum: [
      'compra',
      'pagamento_boleto',
      'transferencia',
      'recarga',
<<<<<<< HEAD
      'deposito',
=======
      'deposito',             // ✅ adicionado
      'fatura_aberta',
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
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
<<<<<<< HEAD
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
=======
  status: { type: String, enum: ['pendente','concluida','cancelada'], default: 'pendente' },
  tipoOperacao: { type: String, enum: ['credito','debito'], required: true },
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

  // Parcelamento
  parcelado: { type: Boolean, default: false },
  numeroParcelas: { type: Number, default: 1 },
  parcelaAtual: { type: Number, default: 1 },
  valorParcela: { type: Number },
  juros: { type: Number, default: 0 },

<<<<<<< HEAD
  // Integração com Fatura
  fatura: { type: mongoose.Schema.Types.ObjectId, ref: 'Fatura' },

  // Relações entre transações
=======
  // Relações
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
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
<<<<<<< HEAD

=======
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
}, { timestamps: true });

// =========================
// MÉTODOS ESTÁTICOS
// =========================

<<<<<<< HEAD
// Cria parcelas de uma compra
TransactionSchema.statics.criarParcelas = async function({ usuarioId, valorTotal, numeroParcelas, descricao, faturaId }) {
=======
// Gera uma fatura aberta para o usuário
TransactionSchema.statics.gerarFatura = async function(usuarioId, mesReferencia) {
  return this.create({
    usuario: usuarioId,
    tipo: 'fatura_aberta',
    descricao: `Fatura referente a ${mesReferencia}`,
    valor: 0,
    tipoOperacao: 'credito',
    status: 'pendente'
  });
};

// Cria parcelas de uma compra
TransactionSchema.statics.criarParcelas = async function({ usuarioId, valorTotal, numeroParcelas, descricao }) {
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
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
<<<<<<< HEAD
      status: 'pendente',
      fatura: faturaId
=======
      status: 'pendente'
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    });
    parcelas.push(tx);
  }

<<<<<<< HEAD
  // Vincula parcelas entre si
=======
  // Vincula as parcelas entre si
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
  for (const p of parcelas) {
    p.parcelasVinculadas = parcelas.map(pp => pp._id);
    await p.save();
  }

  return parcelas;
};

<<<<<<< HEAD
// Vincula uma transação existente a uma fatura
TransactionSchema.statics.vincularAFatura = async function(transactionId, faturaId) {
  const tx = await this.findById(transactionId);
  if (!tx) throw new Error("Transação não encontrada");

  tx.fatura = faturaId;
  await tx.save();
  return tx;
};

=======
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
// =========================
// MÉTODOS DE INSTÂNCIA
// =========================

<<<<<<< HEAD
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
=======
// Recalcula o valor de uma fatura aberta com base nas transações vinculadas
TransactionSchema.methods.recalcularFatura = async function() {
  if (this.tipo !== 'fatura_aberta') return null;

  const total = await mongoose.model('Transaction').aggregate([
    { $match: { referenciaFatura: this._id, status: { $ne: 'cancelada' } } },
    { $group: { _id: null, soma: { $sum: '$valor' } } }
  ]);

  this.valor = total[0]?.soma || 0;
  await this.save();
  return this.valor;
};

console.log('Modelo Transaction registrado ✅');
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
export default mongoose.model('Transaction', TransactionSchema);
