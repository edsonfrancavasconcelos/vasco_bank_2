// backend/utils/gerarFaturaMensal.js
import Fatura from "../models/Fatura.js";

export async function gerarFaturaMensal(usuarioId) {
  const hoje = new Date();
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), 11); // sempre dia 15

  // evita duplicar fatura aberta do mês
  const existe = await Fatura.findOne({
    usuarioId,
    dataVencimento: { $gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1), $lte: vencimento },
  });
  if (existe) return existe;

  const nova = await Fatura.create({
    usuarioId,
    valor: 0,
    dataVencimento: vencimento,
    status: "aberta",
  });
  return nova;
}
