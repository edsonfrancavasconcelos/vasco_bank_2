// backend/utils/saldo.js
import User from '../models/Usuario.js';

export async function atualizarSaldo(userId, valor, tipoOperacao) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuário não encontrado');

  if (tipoOperacao === 'SAIDA' && user.saldo < valor) {
    throw new Error('Saldo insuficiente');
  }

  user.saldo = tipoOperacao === 'ENTRADA' ? user.saldo + valor : user.saldo - valor;
  await user.save();
  return user.saldo;
}
