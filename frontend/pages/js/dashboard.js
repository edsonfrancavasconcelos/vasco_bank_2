// frontend/pages/js/dashboard.js
import { fetchWithAuth, formatCurrency } from './utils.js';
import { abrirModal, fecharModal } from './modals.js';
import { mostrarHistorico, inicializarHistorico } from './historico.js';

export async function initDashboard() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token não encontrado. Redirecionando para login.");
      window.location.href = "/login.html";
      return;
    }

    // ----------------------
    // Elementos do DOM
    // ----------------------
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

    // ----------------------
    // Função auxiliar de fetch
    // ----------------------
    async function fetchData(url, options = {}) {
      const res = await fetchWithAuth(url, options);
      if (!res) throw new Error("Resposta vazia do servidor.");
      if (typeof res === 'object' && 'success' in res && !res.success) {
        throw new Error(res.error || res.message || 'Erro do servidor.');
      }
      return res.data ?? res;
    }

    // ----------------------
    // Buscar fatura atual
    // ----------------------
    async function buscarFaturaAtual() {
      try {
        const faturas = await fetchData("/api/user/faturas");
        if (!Array.isArray(faturas)) return { id: "", valor: 0, raw: null };
        const candidata = faturas.find(f => f.status === "aberta" && Number(f.valor) > 0)
          || faturas.find(f => Number(f.valor) > 0);
        if (!candidata) return { id: "", valor: 0, raw: null };
        return { id: candidata._id || candidata.id || '', valor: Number(candidata.valor || 0), raw: candidata };
      } catch (err) {
        console.error("buscarFaturaAtual erro:", err);
        return { id: "", valor: 0, raw: null };
      }
    }

    // ----------------------
    // Atualizar dashboard principal
    // ----------------------
    async function atualizarDashboard() {
      try {
        const data = await fetchData("/api/user/me");
        const { nome, numeroConta, saldo = 0, fatura = 0, faturaId } = data;

        let idFatura = faturaId || "";
        let valorFatura = Number(fatura || 0);

        if (!idFatura || valorFatura <= 0) {
          const f = await buscarFaturaAtual();
          idFatura = idFatura || f.id;
          valorFatura = valorFatura || f.valor;
        }

        nomeUsuarioEl.textContent = nome || "Usuário";
        numeroContaEl.textContent = numeroConta || "----";
        saldoEl.textContent = formatCurrency(Number(saldo));

        faturaEl.dataset.valor = valorFatura;
        faturaEl.dataset.faturaId = idFatura;

        const diaAtual = new Date().getDate();
        if (valorFatura > 0 && idFatura) {
          faturaEl.textContent = diaAtual >= 30
            ? `Pagar Fatura: ${formatCurrency(valorFatura)}`
            : `Fatura aberta: ${formatCurrency(valorFatura)}`;
          faturaEl.classList.toggle("pagar-fatura", diaAtual >= 30);
        } else {
          faturaEl.textContent = formatCurrency(0);
          faturaEl.classList.remove("pagar-fatura");
        }

        listaDebito.innerHTML = "";
        listaCredito.innerHTML = "";
        listaDebito.classList.add("hidden");
        listaCredito.classList.add("hidden");
        btnDebito.textContent = "Histórico de Débito";
        btnCredito.textContent = "Histórico de Crédito";
      } catch (err) {
        abrirModal("Erro", `<p>Erro ao atualizar dashboard: ${err.message}</p>`);
      }
    }

    // ----------------------
    // Atualizar saldo/fatura
    // ----------------------
    async function atualizarSaldoFatura() {
      try {
        const registros = await fetchData("/api/user/me/historico?tipo=credito");
        const saldo = Array.isArray(registros)
          ? registros.reduce((acc, item) => acc + Number(item.valor || 0), 0)
          : 0;
        const diaAtual = new Date().getDate();
        faturaEl.dataset.valor = saldo;
        faturaEl.textContent = diaAtual >= 30
          ? `Pagar Fatura: ${formatCurrency(saldo)}`
          : `Fatura aberta: ${formatCurrency(saldo)}`;
        faturaEl.classList.toggle("pagar-fatura", diaAtual >= 30);
      } catch (err) {
        console.error("Erro ao atualizar saldo da fatura:", err);
      }
    }

    // ----------------------
    // Processar antecipação ou pagamento
    // ----------------------
    async function processarPagamento(faturaId, valor, metodoPagamento) {
      const res = await fetch("/api/user/faturas/antecipar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ faturaId, valor, metodoPagamento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.mensagem || "Erro ao processar pagamento.");
      return data;
    }

    // ----------------------
    // Abrir modal de fatura
    // ----------------------
    faturaEl.addEventListener("click", async () => {
      const valorFatura = Number(parseFloat(faturaEl.dataset.valor || 0));
      const faturaId = faturaEl.dataset.faturaId;

      if (isNaN(valorFatura) || valorFatura <= 0) return abrirModal("Aviso", "<p>Não há fatura para pagar.</p>");
      if (!faturaId) return abrirModal("Erro", "<p>Nenhuma fatura aberta encontrada. Tente novamente mais tarde.</p>");

      const diaAtual = new Date().getDate();

      if (diaAtual < 30) {
        // Modal antecipação
        abrirModal(
          "Antecipar Fatura",
          `<div style="color:#fff;">
            <p>Valor total da fatura: <strong>${formatCurrency(valorFatura)}</strong></p>
            <label>Quanto deseja antecipar?</label>
            <input type="number" id="valorAnteciparInput" min="0.01" max="${valorFatura}" step="0.01" placeholder="Digite o valor (R$)">
            <label>Forma de pagamento:</label>
            <select id="metodoPagamentoSelect">
              <option value="">Selecione</option>
              <option value="pix">Pix</option>
              <option value="saldo">Saldo da conta</option>
              <option value="boleto">Boleto</option>
              <option value="credito">Cartão de crédito</option>
            </select>
            <button id="confirmarAntecipacaoBtn" class="btn laranja">💰 Confirmar Antecipação</button>
          </div>`
        );

        document.getElementById("confirmarAntecipacaoBtn")?.addEventListener("click", async () => {
          const valor = Number(parseFloat(document.getElementById("valorAnteciparInput").value || 0).toFixed(2));
          const metodoPagamento = document.getElementById("metodoPagamentoSelect").value;

          if (isNaN(valor) || valor <= 0 || valor > valorFatura) return abrirModal("Erro", `<p>Informe um valor válido (máx: ${formatCurrency(valorFatura)})</p>`);
          if (!metodoPagamento) return abrirModal("Erro", "<p>Selecione uma forma de pagamento.</p>");

          try {
            const data = await processarPagamento(faturaId, valor, metodoPagamento);
            abrirModal("Sucesso", `<p>${data.mensagem || "Antecipação realizada com sucesso!"}</p>`);
            await atualizarSaldoFatura();
            await atualizarDashboard();
          } catch (err) {
            abrirModal("Erro", `<p>${err.message}</p>`);
          }
        });
      } else {
        // Modal pagamento após dia 30
        abrirModal(
          "Pagamento de Fatura",
          `<p>Escolha o método para pagar <strong>${formatCurrency(valorFatura)}</strong>:</p>
          <div class="btn-group-modal">
            <button id="opSaldo" class="btn laranja">Saldo</button>
            <button id="opPix" class="btn laranja">Pix</button>
            <button id="opCredito" class="btn laranja">Crédito</button>
            <button id="opBoleto" class="btn laranja">Boleto</button>
            <button id="opPDF" class="btn cinza">Gerar PDF</button>
          </div>`
        );

        const metodos = ["opSaldo", "opPix", "opCredito", "opBoleto"];
        metodos.forEach(id => {
          document.getElementById(id)?.addEventListener("click", async () => {
            const metodoPagamento = id.replace("op", "").toLowerCase();
            try {
              const data = await processarPagamento(faturaId, valorFatura, metodoPagamento);
              abrirModal("Sucesso", `<p>${data.mensagem || "Pagamento realizado com sucesso!"}</p>`);
              faturaEl.dataset.valor = 0;
              faturaEl.dataset.faturaId = "";
              faturaEl.textContent = formatCurrency(0);
              faturaEl.classList.remove("pagar-fatura");
              await atualizarSaldoFatura();
              await atualizarDashboard();
            } catch (err) {
              abrirModal("Erro", `<p>${err.message}</p>`);
            }
          });
        });

        document.getElementById("opPDF")?.addEventListener("click", async () => {
          try {
            const res = await fetch("/api/user/fatura/pdf", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          } catch (err) {
            abrirModal("Erro", `<p>Falha ao gerar PDF: ${err.message}</p>`);
          }
        });
      }
    });

    // ----------------------
    // Toggle histórico
    // ----------------------
    async function toggleHistorico(tipo) {
      const lista = tipo === "debito" ? listaDebito : listaCredito;
      const btn = tipo === "debito" ? btnDebito : btnCredito;
      const outroBtn = tipo === "debito" ? btnCredito : btnDebito;
      const outraLista = tipo === "debito" ? listaCredito : listaDebito;

      outraLista.classList.add("hidden");
      outroBtn.textContent = `Histórico de ${tipo === "debito" ? "Crédito" : "Débito"}`;
      outroBtn.classList.remove("active");

      if (lista.classList.contains("hidden")) {
        btn.classList.add("active");
        btn.textContent = `Esconder ${tipo === "debito" ? "Débitos" : "Créditos"}`;
        try {
          const data = await fetchData(`/api/user/me/historico?tipo=${tipo}`);
          lista.innerHTML = "";
          if (Array.isArray(data) && data.length) {
            mostrarHistorico(data, lista, tipo);
          } else {
            lista.innerHTML = `<li class="historico-empty">Nenhum ${tipo} encontrado.</li>`;
          }
          lista.classList.remove("hidden");
        } catch {
          lista.innerHTML = `<li class="historico-error">Erro ao carregar ${tipo}.</li>`;
          lista.classList.remove("hidden");
        }
      } else {
        lista.classList.add("hidden");
        btn.classList.remove("active");
        btn.textContent = `Histórico de ${tipo === "debito" ? "Débito" : "Crédito"}`;
      }
    }

    btnDebito?.addEventListener("click", () => toggleHistorico("debito"));
    btnCredito?.addEventListener("click", () => toggleHistorico("credito"));

    // ----------------------
    // Inicialização
    // ----------------------
    inicializarHistorico();
    await atualizarDashboard();
    await atualizarSaldoFatura();

    setInterval(async () => {
      await atualizarDashboard();
      await atualizarSaldoFatura();
    }, 10 * 60 * 1000);

  } catch (err) {
    console.error("initDashboard erro:", err);
    abrirModal("Erro", "<p>Falha ao carregar o dashboard. Faça login novamente.</p>");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});
