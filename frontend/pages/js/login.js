console.log('Iniciando login.js');

export function initLoginPage() {
  console.log('Inicializando página de login');

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Função que inicializa os eventos
  function init() {
    console.log('DOM carregado');

    const loginForm = document.getElementById('loginForm');
    const resetForm = document.getElementById('resetForm');
    const resetLink = document.getElementById('resetLink');

    if (!loginForm || !resetForm || !resetLink) {
      console.warn('Página atual não é de login, ignorando login.js');
      return;
    }

    // === RESET LINK ===
    resetLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      resetForm.style.display = 'block';
      console.log('Exibindo formulário de reset');
    });

    // === LOGIN ===
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Evento de submit disparado no loginForm');

      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value;

      if (!email || !senha) {
        alert('Email e senha são obrigatórios.');
        return;
      }

      if (!isValidEmail(email)) {
        alert('Por favor, insira um email válido.');
        return;
      }

      try {
        console.log('Enviando login para o servidor...');
        const response = await fetch('http://localhost:3000/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        });

        const data = await response.json();
        console.log('Resposta do login:', data);

        if (response.ok && data.token) {
          localStorage.setItem('token', data.token);
          console.log('Token salvo no localStorage:', data.token);
          window.location.href = 'dashboard.html';
        } else {
          alert(`Erro: ${data.message || 'Credenciais inválidas'}`);
        }
      } catch (error) {
        console.error('Erro ao logar:', error);
        alert('Não foi possível conectar ao servidor. Verifique se o backend está ativo na porta 3000.');
      }
    });

    // === RESET DE SENHA ===
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Evento de submit disparado no resetForm');

      const email = document.getElementById('resetEmail').value.trim();
      const novaSenha = document.getElementById('novaSenha').value;

      if (!email || !novaSenha) {
        alert('Email e nova senha são obrigatórios.');
        return;
      }

      if (!isValidEmail(email)) {
        alert('Por favor, insira um email válido.');
        return;
      }

      try {
        console.log('Enviando reset para o servidor...');
        const response = await fetch('http://localhost:3000/api/user/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, novaSenha }),
        });

        const data = await response.json();
        console.log('Resposta do reset:', data);

        if (response.ok) {
          alert('Senha redefinida com sucesso! Faça login com a nova senha.');
          resetForm.style.display = 'none';
          loginForm.style.display = 'block';
        } else {
          alert(`Erro: ${data.message || 'Erro ao redefinir senha.'}`);
        }
      } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        alert('Não foi possível conectar ao servidor. Verifique se o backend está ativo na porta 3000.');
      }
    });
  }

  // ⚡ Executa init() imediatamente se o DOM já estiver carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// ⚡ Chama a função principal
initLoginPage();
