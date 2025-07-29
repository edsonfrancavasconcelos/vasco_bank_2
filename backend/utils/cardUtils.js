// Gera um número de cartão de 16 dígitos (simulado, para teste)
function generateCardNumber(brand) {
  const prefixes = {
    Mastercard: ['51', '52', '53', '54', '55'],
    Visa: ['4']
  };
  const prefix = prefixes[brand][Math.floor(Math.random() * prefixes[brand].length)];
  let number = prefix;
  while (number.length < 16) {
    number += Math.floor(Math.random() * 10);
  }
  return number;
}

// Gera um CVV de 3 dígitos
function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}

// Gera uma data de expiração (MM/AA, 4 anos a partir de agora)
function generateExpiry() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear() + 4).slice(-2);
  return `${month}/${year}`;
}

module.exports = { generateCardNumber, generateCVV, generateExpiry };