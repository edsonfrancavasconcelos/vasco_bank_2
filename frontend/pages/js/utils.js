export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  console.log('[UTILS] Token obtido:', token);

  if (!token) {
    console.error('[UTILS] Token não encontrado');
    return { 
      success: false, 
      status: 401, 
      error: "Não autorizado: token não encontrado", 
      data: null 
    };
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  console.log('[UTILS] URL da requisição:', url);
  console.log('[UTILS] Cabeçalhos enviados:', headers);
  console.log('[UTILS] Opções da requisição:', JSON.stringify(options, null, 2));

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // caso precise enviar cookies
    });

    console.log('[UTILS] Status da resposta:', res.status);

    // Converter headers para objeto simples para log
    const headersObj = {};
    res.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    console.log('[UTILS] Headers da resposta:', headersObj);

    let data = null;
    try {
      data = await res.json();
      console.log('[UTILS] Dados da resposta:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[UTILS] Erro ao parsear JSON:', error.message);
      data = null;
    }

    return {
      success: res.ok,
      status: res.status,
      data: data?.data ?? data ?? null,
      error: !res.ok
        ? (data?.message || data?.error || `Erro desconhecido (status ${res.status})`)
        : null
    };
  } catch (err) {
    console.error('[UTILS] Erro no fetchWithAuth:', err.message);
    return {
      success: false,
      status: 0,
      error: err.message || "Erro de rede",
      data: null
    };
  }
}

// -----------------------------
// Formata valores monetários
// -----------------------------
export function formatCurrency(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor) || 0);
}
