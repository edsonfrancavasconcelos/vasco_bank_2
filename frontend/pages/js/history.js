document.addEventListener('DOMContentLoaded', async () => {
  const historyBody = document.getElementById('history-body');

  try {
    const response = await fetch('http://localhost:3000/api/transactions/history', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
    });
    const transactions = await response.json();

    if (response.ok) {
      historyBody.innerHTML = transactions.map(t => `
        <tr>
          <td>${new Date(t.date).toLocaleString('pt-BR')}</td>
          <td>${t.type}</td>
          <td style="color: ${t.type.includes('withdraw') || t.type.includes('transfer') ? 'red' : 'green'}">
            ${t.amount.toFixed(2)}
          </td>
          <td>${t.description}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">Nenhuma transação encontrada</td></tr>';
    } else {
      historyBody.innerHTML = '<tr><td colspan="4">Erro ao carregar histórico</td></tr>';
    }
  } catch (error) {
    historyBody.innerHTML = '<tr><td colspan="4">Erro ao carregar histórico</td></tr>';
    window.location.href = 'login.html';
  }
});