document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  e.stopPropagation(); // Impede propagação de eventos

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const message = document.getElementById('message');

  if (!email || !password) {
    console.error('Erro: email ou senha ausentes');
    message.textContent = 'Por favor, preencha todos os campos.';
    message.className = 'mt-3 text-danger';
    return;
  }

  const body = { email, password };
  console.log('Tentando logar com:', { email, password: '[HIDDEN]' });

  try {
    console.log('Enviando login:', body);
    const response = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Status da resposta:', response.status, response.statusText);
    console.log('Resposta do backend:', data);

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Erro desconhecido');
    }

    // Salva token e nome do usuário
    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.user.fullName);
    console.log('Login bem-sucedido, token salvo:', data.token);

    message.textContent = 'Login realizado com sucesso! Redirecionando...';
    message.className = 'mt-3 text-success';

    // Redireciona imediatamente para o dashboard
    window.location.href = 'dashboard.html';

  } catch (error) {
    console.error('Erro no login:', error);
    message.textContent = `Erro: ${error.message}`;
    message.className = 'mt-3 text-danger';
  }
});
