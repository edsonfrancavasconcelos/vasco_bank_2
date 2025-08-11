// createUser.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createUserForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Captura valores do formulário
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

    // Valida senha
    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    try {
      // Requisição para o backend
      const resposta = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          cpf,
          telefone,
          endereco,
          senha,
        }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert("Conta criada com sucesso!");
        window.location.href = "login.html";
      } else {
        alert(dados.error || "Erro ao criar conta. Tente novamente.");
      }
    } catch (erro) {
      console.error("Erro ao criar conta:", erro);
      alert("Erro de conexão com o servidor.");
    }
  });
});
