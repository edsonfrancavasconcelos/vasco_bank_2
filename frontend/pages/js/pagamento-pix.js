import { debounce, fetchRecipient, validatePixKey } from "./pix-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const pixKeyInput = document.getElementById("pix-key");
  const recipientInfo = document.getElementById("recipient-info");
  const pixError = document.getElementById("pix-error");
  const pixLoading = document.getElementById("pix-loading");
  const submitBtn = document.getElementById("submit-btn");
  const form = document.getElementById("payment-form");

  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    pixError.textContent = "Você precisa estar logado. Redirecionando...";
    setTimeout(() => (window.location.href = "login.html"), 2000);
    return;
  }

  recipientInfo.dataset.action = "pagando para";

  const fetchRecipientDebounced = debounce(
    (pixKey) => fetchRecipient(pixKey, recipientInfo, pixError, pixLoading, submitBtn, jwt),
    500
  );

  pixKeyInput.addEventListener("input", () => {
    const pixKey = pixKeyInput.value.trim();
    if (pixKey) {
      fetchRecipientDebounced(pixKey);
    } else {
      pixError.textContent = "";
      pixLoading.textContent = "";
      recipientInfo.classList.add("hidden");
      submitBtn.disabled = true;
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pixKey = pixKeyInput.value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const description = document.getElementById("description").value.trim();

    pixError.textContent = "";

    if (!pixKey || !amount) {
      pixError.textContent = "Preencha a chave Pix e o valor.";
      return;
    }

    if (!validatePixKey(pixKey)) {
      pixError.textContent = "Chave Pix inválida.";
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/pix/transfer", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: pixKey,
          amount,
          description: description || "Nenhuma",
          date: new Date().toISOString(),
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao realizar pagamento");

      alert(`Pagamento de R$${amount.toFixed(2)} realizado com sucesso!`);
      form.reset();
      recipientInfo.classList.add("hidden");
      pixLoading.textContent = "";
      submitBtn.disabled = true;
    } catch (error) {
      pixError.textContent = `Erro ao realizar pagamento: ${error.message}`;
      pixError.className = "text-danger";
      console.error(error);
    }
  });
});