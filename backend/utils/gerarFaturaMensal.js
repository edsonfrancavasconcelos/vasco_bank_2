// backend/utils/gerarFaturaMensal.js
<<<<<<< HEAD
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
=======
import Transaction from "../models/Transaction.js";
import Usuario from "../models/Usuario.js";

/**
 * Gera uma nova fatura mensal para o usuário, se ainda não existir.
 * - Cria apenas uma fatura aberta por mês
 * - Define data de vencimento para o dia 15
 * - Atualiza o campo faturaAtual no usuário
 */
export async function gerarFaturaMensal(usuarioId) {
  const hoje = new Date();

  // 📅 Define o vencimento para o dia 15 do mês atual
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), 15);

  // 🔍 Evita duplicar fatura aberta do mês
  const existe = await Transaction.findOne({
    usuario: usuarioId,
    tipo: "fatura_aberta",
    dataVencimento: {
      $gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
      $lte: vencimento,
    },
  });

  if (existe) return existe;

  // 🧾 Cria nova fatura
  const novaFatura = await Transaction.create({
    usuario: usuarioId,
    tipo: "fatura_aberta",
    descricao: "Fatura aberta do mês",
    valor: 0,
    tipoOperacao: "credito",
    status: "pendente",
    dataVencimento: vencimento,
  });

  // 💾 Atualiza usuário com referência e valor atual
  const usuario = await Usuario.findById(usuarioId);
  if (usuario) {
    usuario.faturaAtual = novaFatura.valor;
    await usuario.save();
  }

  console.log(`🧾 Nova fatura criada para usuário ${usuarioId} com vencimento em ${vencimento.toLocaleDateString("pt-BR")}`);

  return novaFatura;
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
}
