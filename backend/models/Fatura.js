import mongoose from "mongoose";

const FaturaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  mesReferencia: { type: String, required: true },
  valorTotal: { type: Number, default: 0 },
  status: { type: String, enum: ["aberta", "paga"], default: "aberta" },
  transacoes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
  dataVencimento: { type: Date, required: true },
  dataPagamento: { type: Date }
}, { timestamps: true });

export default mongoose.model("Fatura", FaturaSchema);
