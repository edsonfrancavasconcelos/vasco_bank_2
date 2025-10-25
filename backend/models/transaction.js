// backend/models/Transaction.js
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  // Tipo da transação
  tipo: { 
    type: String, 
    enum: [
      'compra',
      'pagamento_boleto',
      'transferencia',
      'recarga',
      'deposito',
      'fatura_aberta',
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
  status: { type: String, enum: ['pendente','concluida','cancelada'], default: 'pendente' },
  tipoOperacao: { type: String, enum: ['credito','debito'], required: true },

  // Parcelamento
  parcelado: { type: Boolean, default: false },
  numeroParcelas: { type: Number, default: 1 },
  parcelaAtual: { type: Number, default: 1 },
  valorParcela: { type: Number },
  juros: { type: Number, default: 0 },

  // Relações
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

// Gera uma fatura aberta para o usuário (não cria duplicadas)
TransactionSchema.statics.gerarFatura = async function(usuarioId, mesReferencia) {
  const faturaExistente = await this.findOne({
    usuario: usuarioId,
    tipo: 'fatura_aberta',
    status: 'pendente'
  });
  if (faturaExistente) return faturaExistente;

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
      status: 'pendente'
    });
    parcelas.push(tx);
  }

  // Vincula as parcelas entre si
  for (const p of parcelas) {
    p.parcelasVinculadas = parcelas.map(pp => pp._id);
    await p.save();
  }

  return parcelas;
};

// =========================
// MÉTODOS DE INSTÂNCIA
// =========================

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

console.log('Modelo Transaction atualizado ✅');
export default mongoose.model('Transaction', TransactionSchema);
