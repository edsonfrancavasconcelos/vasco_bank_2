document.addEventListener("DOMContentLoaded", async () => {
  const jwt = localStorage.getItem("jwt");
  const statementBody = document.getElementById("statement-body");

  if (!jwt) {
    statementBody.innerHTML = `<tr><td colspan="3">Você precisa estar logado. Redirecionando...</td></tr>`;
    setTimeout(() => (window.location.href = "login.html"), 2000);
    return;
  }

  try {
    // Obter accountId do usuário
    const userResponse = await fetch("http://localhost:3000/api/users/info", {
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });
    const userData = await userResponse.json();
    if (!userResponse.ok) throw new Error(userData.error || "Erro ao buscar usuário");

    const response = await fetch("http://localhost:3000/api/transactions/history", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();

    if (response.ok) {
      statementBody.innerHTML = result.transactions
        ?.map((entry) => {
          const isDebit = entry.type.includes("withdraw") || entry.type.includes("transfer");
          return `
          <tr>
            <td>${new Date(entry.date).toLocaleDateString("pt-BR")}</td>
            <td>${entry.description || entry.type}</td>
            <td style="color: ${isDebit ? "red" : "green"}">${entry.amount.toFixed(2)}</td>
          </tr>
        `;
        })
        .join("") || `<tr><td colspan="3">Nenhuma transação encontrada</td></tr>`;
    } else {
      statementBody.innerHTML = `<tr><td colspan="3">${result.error || "Erro ao carregar extrato."}</td></tr>`;
    }
  } catch (error) {
    console.error("Erro ao carregar extrato:", error);
    statementBody.innerHTML = `<tr><td colspan="3">Erro: ${error.message}</td></tr>`;
    if (error.message.includes("Token")) {
      setTimeout(() => (window.location.href = "login.html"), 2000);
    }
  }
});