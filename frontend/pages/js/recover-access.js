document.getElementById("recoverAccessForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim();
  const message = document.getElementById("message");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    message.textContent = "Por favor, insira um e-mail válido.";
    message.className = "text-danger";
    return;
  }

  form.querySelector("button").disabled = true;
  message.textContent = "Enviando...";
  message.className = "text-info";

  try {
    const response = await fetch("http://localhost:5000/api/users/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();

    if (response.ok) {
      message.textContent = "Instruções de recuperação enviadas para seu e-mail!";
      message.className = "text-success";
      form.reset();
    } else {
      message.textContent = result.error || "Erro ao recuperar acesso.";
      message.className = "text-danger";
    }
  } catch (error) {
    message.textContent = "Erro de conexão com o servidor.";
    message.className = "text-danger";
    console.error(error);
  } finally {
    form.querySelector("button").disabled = false;
  }
});