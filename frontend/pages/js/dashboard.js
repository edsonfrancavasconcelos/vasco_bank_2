// Este script roda só após carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  // Pega token e dados do usuário do localStorage
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('userData'));

  // Se não estiver logado, redireciona para login
  if (!token || !userData) {
    alert('Você precisa estar logado para ver sua conta.');
    window.location.href = '/login.html';
    return;
  }

  // Preenche nome e número da conta na página
  document.getElementById('nomeUsuario').textContent = userData.nome;
  document.getElementById('numeroConta').textContent = userData.numeroConta;

  // Busca saldo, fatura e históricos na API
  fetch(`http://localhost:3000/api/user/${userData.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('saldo').textContent = parseFloat(data.saldo).toFixed(2).replace('.', ',');
      document.getElementById('fatura').textContent = parseFloat(data.fatura).toFixed(2).replace('.', ',');

      // Salva histórico para usar nos botões
      window.historicoFatura = data.historicoFatura || [];
      window.historicoSaldo = data.historicoSaldo || [];
    })
    .catch(err => {
      console.error('Erro ao carregar dados do usuário:', err);
      alert('Erro ao carregar dados da conta.');
    });

  // Quando clicar para ver histórico da fatura
  document.getElementById('btnFatura').addEventListener('click', () => mostrarHistorico('fatura'));
  // Quando clicar para ver histórico do saldo
  document.getElementById('btnSaldo').addEventListener('click', () => mostrarHistorico('saldo'));

  // Função para exibir histórico
  function mostrarHistorico(tipo) {
    const lista = document.getElementById('listaHistorico');
    lista.innerHTML = '';

    const historico = tipo === 'fatura' ? window.historicoFatura : window.historicoSaldo;

    if (historico.length === 0) {
      lista.innerHTML = '<li>Nenhum dado encontrado.</li>';
    } else {
      historico.forEach(item => {
        const li = document.createElement('li');
        li.style.padding = '8px 0';
        li.textContent = `${item.data || 'Data não disponível'} - R$ ${parseFloat(item.valor).toFixed(2).replace('.', ',')}`;
        lista.appendChild(li);
      });
    }
    document.getElementById('historico').style.display = 'block';
  }
});

