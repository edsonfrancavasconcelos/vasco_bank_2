// frontend/pages/js/saldo.js
import { fetchWithAuth, formatarValor, getUserId } from "./utils.js";

// -----------------------------
// Atualiza o saldo na tela pegando do backend
// -----------------------------
export async function atualizarSaldo() {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("Usuário não autenticado.");

    const data = await fetchWithAuth(`http://localhost:3000/api/user/${userId}`);
    const saldoEl = document.getElementById("saldo");
    if (saldoEl) saldoEl.textContent = formatarValor(data.saldo);
  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar saldo: " + err.message);
  }
}

// -----------------------------
// Altera o saldo enviando para o backend e atualizando o DOM
// -----------------------------
export async function alterarSaldo(userId, novoSaldo) {
  try {
    const id = userId || getUserId();
    if (!id) throw new Error("Usuário não autenticado.");

    await fetchWithAuth(`http://localhost:3000/api/user/${id}/saldo`, {
      method: "POST",
      body: JSON.stringify({ saldo: novoSaldo }),
    });

    const saldoEl = document.getElementById("saldo");
    if (saldoEl) saldoEl.textContent = formatarValor(novoSaldo);
  } catch (err) {
    console.error(err);
    alert("Erro ao alterar saldo: " + err.message);
  }
}

// Opcional: Atualiza saldo automaticamente ao carregar a página
export function initSaldo() {
  document.addEventListener("DOMContentLoaded", atualizarSaldo);
}
