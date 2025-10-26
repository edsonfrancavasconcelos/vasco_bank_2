import mongoose from "mongoose";

const faturaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  mesReferencia: { type: String, required: true },
  valorTotal: { type: Number, default: 0 },
  status: { type: String, enum: ["aberta", "fechada", "paga", "vencida"], default: "aberta" },
  dataVencimento: { type: Date },
  dataPagamento: { type: Date },
}, { timestamps: true });

export default mongoose.model("Fatura", faturaSchema);
