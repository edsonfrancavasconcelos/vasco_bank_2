document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createPhysicalCardForm");
  const $cardDetailsModal = $('#cardDetailsModal'); // Usar jQuery para o modal (Bootstrap 4)

  if (!form) {
    console.error("Formulário não encontrado.");
    return;
  }

  function showMessage(text, type = "success") {
    console.log(`showMessage: ${text}, type: ${type}`); // Log de depuração
    const messageArea = document.getElementById("message-area");
    if (!messageArea) {
      console.error("Elemento #message-area não encontrado.");
      return;
    }
    if (text) {
      messageArea.innerHTML = `
        <div class="alert alert-${type}" role="alert">
          ${text}
        </div>
      `;
      messageArea.style.display = 'block'; // Garantir que a área seja visível
    } else {
      messageArea.innerHTML = '';
      messageArea.style.display = 'none'; // Esconder quando não há mensagem
    }
  }

  function verifyAuthToken() {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Você precisa estar logado. Redirecionando...", "danger");
      alert("Você precisa estar logado. Redirecionando...");
      setTimeout(() => (window.location.href = "/login.html"), 2000);
      return false;
    }
    return true;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!verifyAuthToken()) return;
    const token = localStorage.getItem("token");

    const payload = {
      fullName: document.getElementById("fullName")?.value,
      email: document.getElementById("email")?.value,
      cpf: document.getElementById("cpf")?.value,
      rg: document.getElementById("rg")?.value,
      address: document.getElementById("address")?.value,
      phoneNumber: document.getElementById("phone-number")?.value,
      type: document.getElementById("cardType")?.value || "physical",
      accountPassword: document.getElementById("accountPassword")?.value
    };

    if (!payload.fullName || !payload.email || !payload.cpf || !payload.rg || !payload.address || !payload.phoneNumber || !payload.accountPassword) {
      showMessage("Todos os campos são obrigatórios.", "danger");
      return;
    }

    try {
      showMessage("Solicitando cartão...", "info"); // Mensagem de carregamento
      const response = await fetch("http://localhost:5000/api/cards/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao solicitar cartão");
      }

     // Preenche modal com os dados do cartão criado
document.getElementById('modalCardNumber').textContent = data.card.number;
document.getElementById('modalCardExpiry').textContent = data.card.expiry || 'N/A';
document.getElementById('modalCardCVV').textContent = data.card.cvv || '***';
document.getElementById('modalCardStatus').textContent = data.card.status || 'pending';

$cardDetailsModal.modal('show'); // <- FALTAVA ISSO AQUI

showMessage("Cartão criado com sucesso!", "success");

  

      // Redireciona após 8 segundos
      setTimeout(() => {
        $cardDetailsModal.modal('hide');
        showMessage(""); // Limpar mensagem antes de redirecionar
        window.location.href = "/dashboard.html";
      }, 8000);

    } catch (error) {
      console.error("Erro ao solicitar cartão:", error);
      showMessage(`Erro: ${error.message}`, "danger");
      alert(`Erro: ${error.message}`);
    }
  });
});