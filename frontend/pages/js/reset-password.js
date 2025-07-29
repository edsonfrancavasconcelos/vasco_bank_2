document.addEventListener('DOMContentLoaded', () => {
  const resetForm = document.getElementById('resetForm');
  const newPasswordInput = document.getElementById('newPassword');
  const resetMessage = document.getElementById('resetMessage');

  // Pega o token da query string da URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    resetMessage.textContent = 'Token de recuperação não encontrado na URL.';
    resetMessage.className = 'alert alert-danger';
    resetForm.style.display = 'none';
    return;
  }

  const setMessage = (text, type) => {
    resetMessage.textContent = text;
    resetMessage.className = `alert alert-${type}`;
  };

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = newPasswordInput.value.trim();

    if (newPassword.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres.', 'warning');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Senha redefinida com sucesso! Você já pode fazer login.', 'success');
        resetForm.reset();
        setTimeout(() => {
          window.location.href = 'login.html'; // Ajuste conforme sua estrutura
        }, 3000);
      } else {
        setMessage(data.error || 'Erro ao redefinir a senha.', 'danger');
      }
    } catch (error) {
      setMessage('Erro na comunicação com o servidor.', 'danger');
    }
  });
});
