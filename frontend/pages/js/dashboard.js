import { fetchWithAuth, formatCurrency } from './utils.js';
import { abrirModal } from './modals.js';
import { mostrarHistorico, inicializarHistorico } from './historico.js';

export async function initDashboard() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token não encontrado. Redirecionando para login.");
      window.location.href = "/login.html";
      return;
    }

    // === ELEMENTOS DO DOM ===
    const nomeUsuarioEl = document.getElementById("nomeUsuario");
    const numeroContaEl = document.getElementById("numeroConta");
    const saldoEl = document.getElementById("saldo");
    const faturaEl = document.getElementById("fatura");
    const btnDebito = document.getElementById("btnDebito");
    const btnCredito = document.getElementById("btnCredito");
    const listaDebito = document.getElementById("historicoDebito");
    const listaCredito = document.getElementById("historicoCredito");

    if (!nomeUsuarioEl || !numeroContaEl || !saldoEl || !faturaEl) {
      throw new Error("Elementos essenciais não encontrados no DOM.");
    }

    // === FETCH CENTRALIZADO COM TOKEN ===
    async function fetchData(url, options = {}) {
      const res = await fetchWithAuth(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
      if (!res) throw new Error("Resposta vazia do servidor.");
      if (!res.success) throw new Error(res.error || res.message || "Erro do servidor.");
      return res.data ?? res;
    }

    // === FUNÇÃO PARA RENDERIZAR FATURA ===
    function renderFatura(valor, faturaId, podePagar) {
      faturaEl.dataset.valor = valor;
      faturaEl.dataset.id = faturaId || "";

      faturaEl.textContent = podePagar
        ? `Pagar Fatura: ${formatCurrency(valor)}`
        : `Fatura Aberta: ${formatCurrency(valor)}`;

      faturaEl.classList.toggle("pagar-fatura", podePagar);
    }

    // === FUNÇÃO PARA ATUALIZAR DASHBOARD E FATURA ===
    async function atualizarDashboardEFatura() {
      try {
        const [userData, faturaData] = await Promise.all([
          fetchData("/api/user/me"),
          fetchData("/api/fatura/atual")
        ]);

        const { nome, numeroConta, saldo = 0 } = userData;
        const { fatura = 0, id, transacoes = [], podePagar = false } = faturaData;

        nomeUsuarioEl.textContent = nome || "Usuário";
        numeroContaEl.textContent = numeroConta || "----";
        saldoEl.textContent = formatCurrency(saldo);
        renderFatura(fatura, id, podePagar);

        // Limpa histórico
        listaDebito.innerHTML = "";
        listaCredito.innerHTML = "";
        listaDebito.classList.add("hidden");
        listaCredito.classList.add("hidden");
        btnDebito.textContent = "Histórico de Débito";
        btnCredito.textContent = "Histórico de Crédito";

        // Renderiza transações
        transacoes.forEach(t => {
          const linha = document.createElement('div');
          linha.classList.add('transacao');
          const valorFormatado = formatCurrency(Number(t.valor));
          linha.innerHTML = `
            <strong>${new Date(t.data).toLocaleDateString()}</strong> — ${t.tipo.toUpperCase()}<br>
            ${t.descricao || t.tipoOperacao}<br>
            Valor: ${t.tipoOperacao === 'credito' ? '+' : '-'}${valorFormatado} | ${t.status}<br>
            Saldo Atual: ${formatCurrency(Number(t.saldoAtual ?? saldo))}
          `;
          if (t.tipoOperacao === 'credito') listaCredito.appendChild(linha);
          else listaDebito.appendChild(linha);
        });

      } catch (err) {
        console.error('[DASHBOARD] Erro:', err);
        if (err.message.includes("401")) {
          alert("Sessão expirada. Faça login novamente.");
          localStorage.removeItem("token");
          window.location.href = "/login.html";
        } else {
          abrirModal("Erro", `<p>Erro ao atualizar dashboard: ${err.message}</p>`);
        }
      }
    }

    // === EVENTOS DE HISTÓRICO ===
    btnDebito?.addEventListener("click", () => mostrarHistorico("debito"));
    btnCredito?.addEventListener("click", () => mostrarHistorico("credito"));

    // === CLIQUE NA FATURA (ANTEICIPAÇÃO / PAGAMENTO) ===
    faturaEl.addEventListener("click", async () => {
      const valorFatura = parseFloat(faturaEl.dataset.valor || 0);
      const podePagar = faturaEl.classList.contains("pagar-fatura");

      if (!podePagar && valorFatura <= 0) {
        return abrirModal("Aviso", "<p>Não há fatura para pagar.</p>");
      }

      // === ANTECIPAÇÃO (antes do dia de pagamento) ===
      if (!podePagar) {
        abrirModal("Antecipar Fatura", `
          <div style="color:#fff;">
            <p>Valor total da fatura: <strong>${formatCurrency(valorFatura)}</strong></p>
            <label>Quanto deseja antecipar?</label>
            <input type="number" id="valorAnteciparInput" min="1" max="${valorFatura}" placeholder="Digite o valor (R$)" style="width:100%;padding:8px;margin:8px 0;border-radius:6px;border:none;outline:none;">
            <label>Forma de pagamento:</label>
            <select id="metodoPagamentoSelect" style="width:100%;padding:8px;margin:8px 0;border-radius:6px;border:none;outline:none;">
              <option value="">Selecione</option>
              <option value="pix">Pix</option>
              <option value="saldo">Saldo da conta</option>
              <option value="boleto">Boleto</option>
              <option value="credito">Cartão de crédito</option>
            </select>
            <button id="confirmarAntecipacaoBtn" class="btn laranja" style="width:100%;margin-top:10px;">Confirmar Antecipação</button>
          </div>`);

        document.getElementById("confirmarAntecipacaoBtn")?.addEventListener("click", async () => {
          const valor = parseFloat(document.getElementById("valorAnteciparInput").value);
          const metodoPagamento = document.getElementById("metodoPagamentoSelect").value;

          if (isNaN(valor) || valor <= 0 || valor > valorFatura)
            return abrirModal("Erro", "<p>Informe um valor válido para antecipar.</p>");
          if (!metodoPagamento) return abrirModal("Erro", "<p>Selecione uma forma de pagamento.</p>");

          try {
            const res = await fetchData("/api/fatura/antecipar", {
              method: "POST",
              body: JSON.stringify({ valor, metodoPagamento })
            });
            abrirModal("Sucesso", `<p>${res.mensagem || "Antecipação realizada com sucesso!"}</p>`);
            await atualizarDashboardEFatura();
          } catch (err) {
            abrirModal("Erro", `<p>${err.message}</p>`);
          }
        });
        return;
      }

      // === PAGAMENTO (dia de vencimento ou depois) ===
      abrirModal("Pagamento de Fatura", `
        <p>Escolha o método para pagar <strong>${formatCurrency(valorFatura)}</strong>:</p>
        <div class="btn-group-modal">
          <button id="opSaldo" class="btn laranja">Saldo</button>
          <button id="opPix" class="btn laranja">Pix</button>
          <button id="opCredito" class="btn laranja">Crédito</button>
          <button id="opBoleto" class="btn laranja">Boleto</button>
        </div>`);

      const metodos = ["Saldo", "Pix", "Credito", "Boleto"];
      metodos.forEach(m => {
        document.getElementById(`op${m}`)?.addEventListener("click", async () => {
          try {
            const res = await fetchData("/api/fatura/pagar", {
              method: "POST",
              body: JSON.stringify({ faturaId: faturaEl.dataset.id, valorPagamento: valorFatura, metodoPagamento: m.toLowerCase() })
            });
            abrirModal("Sucesso", `<p>${res.mensagem || "Pagamento realizado com sucesso!"}</p>`);
            await atualizarDashboardEFatura();
          } catch (err) {
            abrirModal("Erro", `<p>Falha ao pagar fatura: ${err.message}</p>`);
          }
        });
      });
    });

    // === INICIALIZAÇÃO ===
    inicializarHistorico();
    await atualizarDashboardEFatura();
    setInterval(atualizarDashboardEFatura, 10 * 60 * 1000); // Atualiza a cada 10 min
  } catch (err) {
    console.error('[initDashboard] Erro:', err);
    abrirModal("Erro", "Falha ao carregar o dashboard. Faça login novamente.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initDashboard().catch(() => {
    alert("Erro ao iniciar o dashboard. Faça login novamente.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });
});
