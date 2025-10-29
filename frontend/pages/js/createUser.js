<<<<<<< HEAD
export function initCreateUser() {
  const form = document.getElementById("createUserForm");
  if (!form) {
    console.error("[createUser] Formulário createUserForm não encontrado.");
    return;
  }
=======
// frontend/pages/js/createUser.js
export function initCreateUser() {
  const form = document.getElementById("createUserForm");
  if (!form) return console.error("Formulário createUserForm não encontrado");
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Captura valores do formulário
    const nome = document.getElementById("nome")?.value.trim() || '';
    const email = document.getElementById("email")?.value.trim() || '';
    const cpf = document.getElementById("cpf")?.value.trim() || '';
    const telefone = document.getElementById("telefone")?.value.trim() || '';
    const endereco = document.getElementById("endereco")?.value.trim() || '';
    const senha = document.getElementById("senha")?.value.trim() || '';
    const confirmarSenha = document.getElementById("confirmarSenha")?.value.trim() || '';
<<<<<<< HEAD
    let saldoInicial = parseFloat(document.getElementById("saldoInicial")?.value || 0);
    if (isNaN(saldoInicial) || saldoInicial < 0) saldoInicial = 0;

    // Validações no frontend
    if (!nome || !email || !cpf || !telefone || !endereco || !senha || !confirmarSenha) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(nome)) {
      alert("O nome deve conter apenas letras e espaços.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      alert("E-mail inválido.");
      return;
    }

    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf) && !/^\d{11}$/.test(cpf)) {
      alert("CPF inválido. Use o formato 123.456.789-01 ou 12345678901.");
      return;
    }

    if (!/^\(\d{2}\)\s9?\d{4}-\d{4}$/.test(telefone) && !/^\d{10,11}$/.test(telefone)) {
      alert("Telefone inválido. Use o formato (11) 91234-5678 ou 11912345678.");
      return;
    }

=======
    let saldoInicial = parseFloat(document.getElementById("saldoInicial")?.value);
    if (isNaN(saldoInicial) || saldoInicial < 0) saldoInicial = 0;

    // Valida senha
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

<<<<<<< HEAD
    if (senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (saldoInicial > 1000000) {
      alert("O saldo inicial não pode exceder R$ 1.000.000,00.");
      return;
    }

    const payload = {
      nome,
      email,
      cpf: cpf.replace(/[^\d]/g, ''),
      telefone: telefone.replace(/[^\d]/g, ''),
      endereco,
      senha,
      saldo: saldoInicial
    };

    try {
      console.log("[createUser] Enviando requisição:", payload);
      const resposta = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dados = await resposta.json();
      console.log("[createUser] Resposta do servidor:", dados);

      if (resposta.ok) {
        // Esconde o formulário
        form.style.display = "none";

        // Garante que o saldo retornado seja um número
        const saldoRetornado = Number(dados.data?.saldo || saldoInicial || 0);

=======
    try {
      const resposta = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          cpf,
          telefone,
          endereco,
          senha,
          saldo: saldoInicial
        }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        // Corrige: pega o nome certo
        const nomeUsuario = dados.nome || dados.usuario || "Usuário";

        // Esconde o formulário
        form.style.display = "none";

>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
        // Cria o card de sucesso
        const container = document.createElement("div");
        container.className = "sucesso-card";
        container.innerHTML = `
          <div class="sucesso-header">
            <i class="fas fa-check-circle"></i>
            <h2>Conta criada com sucesso!</h2>
          </div>
          <div class="sucesso-body">
            <p><strong>Nome:</strong> ${nome}</p>
<<<<<<< HEAD
            <p><strong>Número da Conta:</strong> ${dados.data?.numeroConta || "N/A"}</p>
            <p><strong>Saldo Inicial:</strong> R$ ${saldoRetornado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
=======
            <p><strong>Número da Conta:</strong> ${dados.numeroConta}</p>
            <p><strong>Saldo Inicial:</strong> R$ ${Number(dados.saldo).toFixed(2)}</p>
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
          </div>
          <div class="sucesso-footer">
            <button id="btnConcluir" class="btn-concluir">Concluir</button>
          </div>
        `;

        document.body.appendChild(container);

        // Redireciona quando clicar em Concluir
        document.getElementById("btnConcluir").addEventListener("click", () => {
          window.location.href = "login.html";
        });
<<<<<<< HEAD
      } else {
        const erro = dados.error || dados.message || "Erro ao criar conta. Tente novamente.";
        if (erro.includes("E-mail já cadastrado") || erro.includes("CPF já cadastrado")) {
          alert(erro);
        } else {
          alert(`Erro ao criar conta: ${erro}`);
        }
      }
    } catch (erro) {
      console.error("[createUser] Erro ao criar conta:", erro);
      alert("Erro de conexão com o servidor. Verifique sua conexão e tente novamente.");
    }
  });
}
=======

      } else {
        alert(dados.error || "Erro ao criar conta. Tente novamente.");
      }
    } catch (erro) {
      console.error("Erro ao criar conta:", erro);
      alert("Erro de conexão com o servidor.");
    }
  });
}
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
