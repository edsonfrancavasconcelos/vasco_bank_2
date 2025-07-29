import { debounce, fetchRecipient, validatePixKey } from "./pix-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const pixKeyInput = document.getElementById("pix-key");
  const recipientInfo = document.getElementById("recipient-info");
  const pixError = document.getElementById("pix-error");
  const pixLoading = document.getElementById("pix-loading");
  const submitBtn = document.getElementById("submit-btn");
  const form = document.getElementById("schedule-form");
  const successMessage = document.getElementById("success-message");

  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    pixError.textContent = "Você precisa estar logado. Redirecionando...";
    setTimeout(() => (window.location.href = "login.html"), 2000);
    return;
  }

  recipientInfo.dataset.action = "programando para";

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
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value.trim();

    pixError.textContent = "";
    successMessage.textContent = "";

    if (!pixKey || !amount || !date) {
      pixError.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    if (!validatePixKey(pixKey)) {
      pixError.textContent = "Chave Pix inválida.";
      return;
    }

    const scheduleDate = new Date(date);
    if (scheduleDate <= new Date()) {
      pixError.textContent = "A data de agendamento deve ser futura.";
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
          scheduleDate: scheduleDate.toISOString(),
          description: description || "Nenhuma",
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao programar transação");

      successMessage.textContent = `Transferência de R$${amount.toFixed(2)} programada para ${scheduleDate.toLocaleString(
        "pt-BR"
      )}!`;
      successMessage.className = "text-success";
      form.reset();
      recipientInfo.classList.add("hidden");
      pixLoading.textContent = "";
      submitBtn.disabled = true;
    } catch (error) {
      pixError.textContent = `Erro ao programar transação: ${error.message}`;
      pixError.className = "text-danger";
      console.error(error);
    }
  });
});