export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user'); // se você guarda info do usuário
  window.location.href = '/pages/login.html';
}
