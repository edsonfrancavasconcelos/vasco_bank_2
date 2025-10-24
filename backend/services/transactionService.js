// services/transactionService.js
import Transaction from '../models/Transaction.js';
import { atualizarSaldo } from './saldoService.js';
import User from '../models/Usuario.js';

export async function criarTransacao(userId, tipo, valor, detalhes = {}) {
  // Determina se é saída ou entrada
  const tipoOperacao = ['PIX', 'TRANSFERENCIA', 'RECARGA', 'BOLETO']
    .includes(tipo.toUpperCase())
    ? 'SAIDA'
    : 'ENTRADA';

  // Atualiza saldo do usuário
  const saldoAtual = await atualizarSaldo(userId, valor, tipoOperacao);

  // Salva transação no banco
  const transacao = await Transaction.create({
    usuario: userId,   // referência ao usuário
    tipo,
    valor,
    ...detalhes        // detalhes extras: operadora, contaOrigem, contaDestino etc.
  });

  // Se for ENTRADA (ex: compra no crédito), atualiza fatura
  if (tipoOperacao === 'ENTRADA') {
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuário não encontrado");

    user.fatura += valor;

    // garante que o histórico existe
    if (!Array.isArray(user.historicoFatura)) {
      user.historicoFatura = [];
    }

    user.historicoFatura.push({
      descricao: detalhes?.descricao || tipo,
      valor,
      data: new Date()
    });

    await user.save();
  }

  return { transacao, saldoAtual };
}

// Lista todas as transações de um usuário (enviadas e recebidas)
export async function listarHistorico(userId) {
  return Transaction.find({
    $or: [
      { usuario: userId },       // transações feitas pelo usuário
      { destinatario: userId }   // transações recebidas
    ]
  }).sort({ data: -1 });
}
