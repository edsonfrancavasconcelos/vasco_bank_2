document.addEventListener('DOMContentLoaded', async () => {
    const pixKeysList = document.getElementById('pixKeysList');
    const pixKeysMessage = document.getElementById('pixKeysMessage');
  
    try {
      const response = await fetch('http://localhost:5000/api/pix/registerKey', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
      });
      const data = await response.json();
  
      if (response.ok && data.pixKey) {
        pixKeysList.innerHTML = `
          <li class="list-group-item">${data.pixKey.type}: ${data.pixKey.value}</li>
        `;
      } else {
        pixKeysMessage.textContent = 'Nenhuma chave Pix registrada.';
      }
    } catch (error) {
      pixKeysMessage.textContent = 'Erro ao carregar chaves Pix.';
      window.location.href = 'login.html';
    }
  });