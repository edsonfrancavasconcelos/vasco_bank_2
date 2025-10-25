// backend/utils/gerarNumeroConta.js
import User from '../models/Usuario.js';

export default async function gerarNumeroContaUnico() {
  let numeroConta;
  let existe = true;

  while (existe) {
    numeroConta = Math.floor(10000000 + Math.random() * 90000000).toString();
    existe = await User.findOne({ numeroConta });
  }

  return numeroConta;
}
