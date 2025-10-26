async function carregarFaturas() {
  const usuarioId = localStorage.getItem('usuarioId'); // supondo que o ID do usuário é salvo no login
  if (!usuarioId) {
    alert("Usuário não identificado!");
    return;
  }

  try {
    const resposta = await fetch(`/api/fatura/listar/${usuarioId}`);
    const faturas = await resposta.json();

    const container = document.getElementById('faturas-container');
    if (!faturas.length) {
      container.innerHTML = "<p>Nenhuma fatura encontrada.</p>";
      return;
    }

    container.innerHTML = faturas.map(f =>
      `<div class="fatura">
         <p><strong>Mês:</strong> ${f.mesReferencia}</p>
         <p><strong>Valor Total:</strong> R$ ${f.valorTotal.toFixed(2)}</p>
         <p><strong>Status:</strong> ${f.status}</p>
         <p><strong>Vencimento:</strong> ${new Date(f.vencimento).toLocaleDateString()}</p>
         ${f.status === 'aberta' ? `<button onclick="pagarFatura('${f._id}')">Pagar</button>` : ''}
       </div>`
    ).join('');
  } catch (err) {
    console.error("Erro ao carregar faturas:", err);
  }
}

async function pagarFatura(id) {
  try {
    const res = await fetch(`/api/fatura/pagar/${id}`, {
      method: 'PUT'
    });

    const data = await res.json();
    alert(data.message);
    carregarFaturas();
  } catch (err) {
    console.error("Erro ao pagar fatura:", err);
  }
}
const faturaEl = document.getElementById("fatura");

export async function atualizarFatura() {
  try {
    const faturaAtual = await fetchWithAuth("/api/user/fatura/atual");
    if (!faturaAtual || !faturaAtual.success) throw new Error("Erro ao buscar fatura");

    const valorFatura = parseFloat(faturaAtual.data?.valor || 0);
    const faturaId = faturaAtual.data?.faturaId || "";

    faturaEl.dataset.valor = valorFatura;
    faturaEl.dataset.id = faturaId;

    const diaAtual = new Date().getDate();
    faturaEl.textContent =
      valorFatura > 0
        ? (diaAtual >= 30
            ? `Pagar Fatura: ${formatCurrency(valorFatura)}`
            : `Fatura aberta: ${formatCurrency(valorFatura)}`)
        : formatCurrency(0);

    faturaEl.classList.toggle("pagar-fatura", valorFatura > 0 && diaAtual >= 30);

  } catch (err) {
    console.error("Erro ao atualizar fatura:", err);
    faturaEl.textContent = formatCurrency(0);
  }
}

// === CLIQUE NA FATURA ===
export function initFaturaClick() {
  faturaEl.addEventListener("click", async () => {
    const valorFatura = parseFloat(faturaEl.dataset.valor || 0);
    if (isNaN(valorFatura) || valorFatura <= 0) {
      return abrirModal("Aviso", "<p>Não há fatura para pagar.</p>");
    }

    // Aqui você mantém toda a lógica de antecipar ou pagar, como já tinha
    // (antecipação antes do dia 30, pagamento dia 30 ou depois, gerar PDF)
  });
}

window.onload = carregarFaturas;
