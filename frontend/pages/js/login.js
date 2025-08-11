// js/login.js

// Função para fazer o login
async function fazerLogin() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  if (!email || !senha) {
    alert('Por favor, preencha email e senha.');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    const data = await res.json();

    if (res.ok) {
      // Salva token e dados do usuário no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      alert('Login realizado com sucesso!');

      // Redireciona para o dashboard
      window.location.href = '/dashboard.html';
    } else {
      alert(data.message || 'Erro no login');
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert('Erro na conexão. Tente novamente mais tarde.');
  }
}

// Função para mostrar o formulário de resetar senha
function exibirReset() {
  document.getElementById('reset').style.display = 'block';
}

// Função para resetar a senha
async function resetarSenha() {
  const email = document.getElementById('resetEmail').value.trim();
  const novaSenha = document.getElementById('novaSenha').value.trim();

  if (!email || !novaSenha) {
    alert('Por favor, preencha email e nova senha.');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/user/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, novaSenha }),
    });

    const data = await res.json();

    if (res.ok) {
      alert('Senha atualizada com sucesso! Use a nova senha para logar.');
      // Opcional: esconder o formulário após resetar
      document.getElementById('reset').style.display = 'none';
    } else {
      alert(data.message || 'Erro ao resetar senha');
    }
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    alert('Erro na conexão. Tente novamente mais tarde.');
  }
}
