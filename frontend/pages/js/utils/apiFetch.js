// frontend/utils/apiFetch.js

export async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na requisição');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao realizar fetch:', error);
    throw error;
  }
}
