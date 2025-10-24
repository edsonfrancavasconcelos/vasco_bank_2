// frontend/pages/js/createUser.js
export function initCreateUser() {
  const form = document.getElementById("createUserForm");
  if (!form) return console.error("Formulário createUserForm não encontrado");

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
    let saldoInicial = parseFloat(document.getElementById("saldoInicial")?.value);
    if (isNaN(saldoInicial) || saldoInicial < 0) saldoInicial = 0;

    // Valida senha
    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

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
            <p><strong>Número da Conta:</strong> ${dados.numeroConta}</p>
            <p><strong>Saldo Inicial:</strong> R$ ${Number(dados.saldo).toFixed(2)}</p>
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

      } else {
        alert(dados.error || "Erro ao criar conta. Tente novamente.");
      }
    } catch (erro) {
      console.error("Erro ao criar conta:", erro);
      alert("Erro de conexão com o servidor.");
    }
  });
}
