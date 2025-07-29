export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export async function fetchRecipient(pixKey, recipientInfo, pixError, pixLoading, submitBtn, jwt) {
  pixError.textContent = "";
  pixLoading.textContent = "Buscando...";
  recipientInfo.classList.add("hidden");
  submitBtn.disabled = true;

  const isValidPixKey =
    /^\d{11}$/.test(pixKey) || // CPF
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(pixKey) || // E-mail
    /^\+\d{12,}$/.test(pixKey) || // Telefone
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(pixKey); // Chave aleatória
  if (!isValidPixKey) {
    pixLoading.textContent = "";
    pixError.textContent = "Chave Pix inválida.";
    return false;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/pix/recipient/${encodeURIComponent(pixKey)}`, {
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    pixLoading.textContent = "";
    if (data.nome) {
      recipientInfo.textContent = `Você está ${recipientInfo.dataset.action || "pagando para"} ${data.nome}`;
      recipientInfo.classList.remove("hidden");
      submitBtn.disabled = false;
      return true;
    } else {
      pixError.textContent = data.error || "Chave Pix não encontrada.";
      return false;
    }
  } catch (error) {
    pixLoading.textContent = "";
    pixError.textContent = "Erro ao buscar destinatário.";
    console.error(error);
    return false;
  }
}

export function validatePixKey(pixKey) {
  return (
    /^\d{11}$/.test(pixKey) || // CPF
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(pixKey) || // E-mail
    /^\+\d{12,}$/.test(pixKey) || // Telefone
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(pixKey) // Chave aleatória
  );
}