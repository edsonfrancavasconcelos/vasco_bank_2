import { apiFetch } from './utils/apiFetch.js';

export async function loadUserData() {
  try {
    const user = await apiFetch('/api/users/me');
    return user;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    throw error;
  }
}
