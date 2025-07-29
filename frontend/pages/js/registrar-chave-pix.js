document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const pixKeyInput = document.getElementById("pix-key");
    const nomeInput = document.getElementById("nome");
    const pixError = document.getElementById("pix-error");
    const nomeError = document.getElementById("nome-error");
    const successMessage = document.getElementById("success-message");
  
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      pixError.textContent = "Você precisa estar logado. Redirecionando...";
      setTimeout(() => (window.location.href = "login.html"), 2000);
      return;
    }
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pixKey = pixKeyInput.value.trim();
      const nome = nomeInput.value.trim();
  
      pixError.textContent = "";
      nomeError.textContent = "";
      successMessage.textContent = "";
  
      if (!pixKey) {
        pixError.textContent = "Por favor, insira uma chave Pix.";
        return;
      }
      if (!nome) {
        nomeError.textContent = "Por favor, insira um nome completo.";
        return;
      }
  
      // Validação de formato da chave Pix
      const isValidPixKey =
        /^\d{11}$/.test(pixKey) || // CPF
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(pixKey) || // E-mail
        /^\+\d{12,}$/.test(pixKey) || // Telefone
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(pixKey); // Chave aleatória
      if (!isValidPixKey) {
        pixError.textContent = "Chave Pix inválida.";
        return;
      }
  
      try {
        const response = await fetch("http://localhost:3000/api/pix/keys", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: detectPixKeyType(pixKey), value: pixKey, nome }),
        });
        const data = await response.json();
  
        if (response.ok) {
          successMessage.textContent = "Chave Pix registrada com sucesso!";
          successMessage.className = "text-success";
          form.reset();
        } else {
          pixError.textContent = data.error || "Erro ao registrar chave.";
          pixError.className = "text-danger";
        }
      } catch (error) {
        pixError.textContent = "Erro ao conectar ao servidor.";
        pixError.className = "text-danger";
        console.error(error);
      }
    });
  
    function detectPixKeyType(key) {
      if (/^\d{11}$/.test(key)) return "cpf";
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(key)) return "email";
      if (/^\+\d{12,}$/.test(key)) return "phone";
      return "random";
    }
  });