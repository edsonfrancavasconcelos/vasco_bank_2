document.getElementById("createAccountForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  let cpf = document.getElementById("cpf").value.trim();
  const rg = document.getElementById("rg").value.trim();
  const address = document.getElementById("address").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  let phone = document.getElementById("phone-number").value.trim();
  const initialBalanceRaw = document.getElementById("initialBalance").value.trim();

  const messageEl = document.getElementById("message");

  // Função para limpar máscaras
  const cleanInput = (input) => input.replace(/\D/g, "");

  // Limpar CPF e telefone
  cpf = cleanInput(cpf);
  phone = cleanInput(phone);

  // Validação de saldo inicial
  const initialBalance = parseFloat(initialBalanceRaw);

  // Validações
  if (!fullName || !email || !cpf || !rg || !address || !phone || !initialBalanceRaw) {
    messageEl.innerHTML = '<div class="alert alert-danger">Todos os campos são obrigatórios!</div>';
    return;
  }

  if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    messageEl.innerHTML = '<div class="alert alert-danger">E-mail inválido!</div>';
    return;
  }

  if (!/^[0-9]{11}$/.test(cpf)) {
    messageEl.innerHTML = '<div class="alert alert-danger">CPF inválido! Use 11 dígitos numéricos.</div>';
    return;
  }

  if (!/^[0-9]{11}$/.test(phone)) {
    messageEl.innerHTML = '<div class="alert alert-danger">Telefone inválido! Use 11 dígitos numéricos.</div>';
    return;
  }

  if (password !== confirmPassword) {
    messageEl.innerHTML = '<div class="alert alert-danger">As senhas não coincidem!</div>';
    return;
  }

  if (!password || password.length < 6) {
    messageEl.innerHTML = '<div class="alert alert-danger">A senha deve ter pelo menos 6 caracteres.</div>';
    return;
  }

  if (isNaN(initialBalance)) {
    messageEl.innerHTML = '<div class="alert alert-danger">Saldo inicial inválido.</div>';
    return;
  }

  const payload = {
    fullName,
    email,
    cpf,
    rg,
    address,
    password,
    phone,
    initialBalance,
  };

  try {
    const response = await fetch("http://localhost:5000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Resposta do servidor não é JSON válida");
    }

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Erro ao criar conta");
    }

    localStorage.setItem("token", data.token);
    messageEl.innerHTML = `<div class="alert alert-success">Conta criada com sucesso! Seu número da conta é: ${data.user.accountNumber}. Redirecionando...</div>`;
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (error) {
    messageEl.innerHTML = `<div class="alert alert-danger">Erro: ${error.message}</div>`;
  }
});
