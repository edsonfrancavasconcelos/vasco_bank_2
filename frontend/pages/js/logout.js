// frontend/pages/js/auth.js

export function logout() {
  // Remove token e dados do usuário
  localStorage.removeItem('token');
  localStorage.removeItem('userData'); // padronizando com 'userData'

  // Redireciona para login
  window.location.href = '/login.html';
}
