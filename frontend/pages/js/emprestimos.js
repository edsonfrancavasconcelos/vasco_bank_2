// simulador.js
export function abrirSimulador(botao, tipo) {
  const parent = botao.closest('.emprestimo');
  if (!parent) return;

  // Fecha todos os simuladores abertos
  document.querySelectorAll('.simulador-card').forEach(card => card.remove());

  // Cria o card de simulação
  const card = document.createElement('div');
  card.className = 'simulador-card';
  card.innerHTML = `
    <button class="btn-fechar">X</button>
    <label>Valor do Empréstimo:</label>
    <input type="number" class="valor" placeholder="Ex: 5000">
    <label>Número de Parcelas:</label>
    <input type="number" class="parcelas" placeholder="Ex: 12">
    <button class="btn-laranja btn-full btn-calcular">Calcular</button>
    <p class="resultado"></p>
  `;
  parent.appendChild(card);

  // Fechar simulador
  card.querySelector('.btn-fechar').addEventListener('click', () => card.remove());

  // Botão calcular
  card.querySelector('.btn-calcular').addEventListener('click', () => calcularSimulacao(card, tipo));
}

// ---------------- Função de cálculo ----------------
function calcularSimulacao(card, tipo) {
  const valor = parseFloat(card.querySelector('.valor').value);
  const parcelas = parseInt(card.querySelector('.parcelas').value);
  const resultado = card.querySelector('.resultado');

  if (isNaN(valor) || isNaN(parcelas) || valor <= 0 || parcelas <= 0) {
    resultado.textContent = "Digite valores válidos!";
    return;
  }

  const taxaJuros = getTaxaJuros(tipo);

  const total = valor * Math.pow(1 + taxaJuros, parcelas);
  const parcela = total / parcelas;

  resultado.textContent = `Simulação ${tipo}: Total ${formatBRL(total)} | ${parcelas}x de ${formatBRL(parcela)}`;
}

// ---------------- Helpers ----------------
function getTaxaJuros(tipo) {
  switch (tipo) {
    case 'Pessoal': return 0.025;
    case 'Consignado': return 0.015;
    default: return 0.02;
  }
}

function formatBRL(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
