import { fetchWithAuth, formatCurrency } from './utils.js';
import { abrirModal } from './modals.js';



// Formatação para data pt-BR
export const formatarData = (dataISO) =>
  dataISO ? new Date(dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data não disponível';

// Requisita histórico do backend com autenticação
export async function carregarHistorico() {
  console.log('[Historico] Iniciando carregarHistorico');
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('[Historico] Usuário não autenticado: token indefinido.');
    abrirModal('Erro', 'Sessão expirada. Faça login novamente.');
    return [];
  }

  try {
    const response = await fetchWithAuth('http://localhost:3000/api/user/me/historico');
    if (!response.success) {
      console.error('[Historico] Erro na resposta do servidor:', response.error);
      abrirModal('Erro', response.error || 'Erro ao buscar histórico');
      return [];
    }
    
    return response.data || [];
  } catch (err) {
    console.error('[Historico] Erro ao buscar histórico:', err.message);
    abrirModal('Erro', err.message || 'Erro ao buscar histórico');
    return [];
  }
}

// Exibe o histórico separando em débito e crédito, com filtro opcional
export function mostrarHistorico(transacoes = [], tipoFiltro = null) {
  const container = document.getElementById('historicoContainer');
  const listaDebito = document.getElementById('historicoDebito');
  const listaCredito = document.getElementById('historicoCredito');

  if (!container || !listaDebito || !listaCredito) {
    console.error('[Historico] Elementos do DOM não encontrados:', { container, listaDebito, listaCredito });
    abrirModal('Erro', 'Erro na interface. Elementos não encontrados.');
    
    return;
  }

  container.style.display = 'block';
  listaDebito.innerHTML = '';
  listaCredito.innerHTML = '';

  const transacoesInvertidas = transacoes.slice().reverse();

  // Filtra transações para os dois tipos baseado no campo tipoOperacao
  const debitos = transacoesInvertidas.filter(item => (item.tipoOperacao || '').toLowerCase() === 'debito');
  const creditos = transacoesInvertidas.filter(item => (item.tipoOperacao || '').toLowerCase() === 'credito');

  // Função para renderizar lista
  const renderList = (listaElement, listaTransacoes, isDebito) => {
    let saldoTemp = Number(JSON.parse(localStorage.getItem('userData') || '{}').saldo || 0);
    if (listaTransacoes.length === 0) {
      const msg = '<li style="color:red;padding:10px;font-size:16px;font-weight:bold;">Nenhuma transação disponível.</li>';
      listaElement.innerHTML = msg;
      return;
    }

    listaTransacoes.forEach(item => {
      const valorNumerico = Number(item.valor) || 0;
      saldoTemp = isDebito ? saldoTemp - valorNumerico : saldoTemp + valorNumerico;
      const sinal = isDebito ? '-' : '+';
      const status = item.status ? ` | ${item.status}` : '';

      const li = document.createElement('li');
      li.style.cssText = `
        background: #1e1e1e;
        color: #fff;
        padding: 12px 16px;
        margin-bottom: 10px;
        border-left: 5px solid ${isDebito ? '#ff6600' : '#00aa00'};
        border-radius: 10px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.5;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        word-break: break-word;
        font-size: 16px;
      `;

      li.innerHTML = `
        <div><strong>${formatarData(item.data)} — ${(item.tipoOperacao || item.tipo || 'Desconhecido').toUpperCase()}</strong></div>
        ${item.descricao ? `<div>${item.descricao}</div>` : ''}
        <div>Valor: ${sinal}${formatCurrency(Math.abs(valorNumerico))}${status}</div>
        <div>Saldo Atual: ${formatCurrency(saldoTemp)}</div>
      `;

      listaElement.appendChild(li);
    });
  };

  // Controla visibilidade conforme filtro (null = todos)
  listaDebito.style.display = tipoFiltro === null || tipoFiltro === 'debito' ? 'block' : 'none';
  listaCredito.style.display = tipoFiltro === null || tipoFiltro === 'credito' ? 'block' : 'none';

  if (tipoFiltro === null || tipoFiltro === 'debito') renderList(listaDebito, debitos, true);
  if (tipoFiltro === null || tipoFiltro === 'credito') renderList(listaCredito, creditos, false);
}

// Inicializa botões para filtrar histórico e carrega histórico padrão
export async function inicializarHistorico() {
  const btnTodos = document.getElementById('btnTodas');
  const btnDebito = document.getElementById('btnDebito');
  const btnCredito = document.getElementById('btnCredito');

  const carregarEMostrar = async (tipoFiltro = null) => {
    try {
      const transacoes = await carregarHistorico();
      mostrarHistorico(transacoes, tipoFiltro);
    } catch (err) {
      console.error('[Historico] Erro ao carregar e mostrar histórico:', err);
      abrirModal('Erro', 'Erro ao carregar histórico. Tente novamente.');
    }
  };

  if (btnTodos) btnTodos.addEventListener('click', () => carregarEMostrar(null));
  if (btnDebito) btnDebito.addEventListener('click', () => carregarEMostrar('debito'));
  if (btnCredito) btnCredito.addEventListener('click', () => carregarEMostrar('credito'));

  await carregarEMostrar();
}
