<<<<<<< HEAD
import { fetchWithAuth, formatCurrency } from './utils.js';
import { abrirModal } from './modals.js';
=======
// frontend/pages/js/dashboard.js
import { fetchWithAuth, formatCurrency } from './utils.js';
import { abrirModal, fecharModal } from './modals.js';
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
import { mostrarHistorico, inicializarHistorico } from './historico.js';

export async function initDashboard() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token não encontrado. Redirecionando para login.");
      window.location.href = "/login.html";
      return;
    }

<<<<<<< HEAD
    // === ELEMENTOS DO DOM ===
=======
    // ----------------------
    // Elementos do DOM
    // ----------------------
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
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

<<<<<<< HEAD
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
    function renderFatura(valor, faturaId) {
      const diaAtual = new Date().getDate();
      faturaEl.dataset.valor = valor;
      faturaEl.dataset.id = faturaId || "";
      faturaEl.textContent =
        valor > 0
          ? diaAtual >= 30
            ? `Pagar Fatura: ${formatCurrency(valor)}`
            : `Fatura aberta: ${formatCurrency(valor)}`
          : `Fatura: ${formatCurrency(0)}`;
      faturaEl.classList.toggle("pagar-fatura", valor > 0 && diaAtual >= 30);
      console.log(`[renderFatura] Fatura renderizada: R$ ${valor}, ID: ${faturaId}`);
    }

    // === FUNÇÃO PARA ATUALIZAR DASHBOARD E FATURA ===
    async function atualizarDashboardEFatura() {
      try {
        console.log('[DASHBOARD] Atualizando dashboard e fatura...');
        const [userData, faturaData] = await Promise.all([
          fetchData("/api/user/me"),
          fetchData("/api/fatura/atual")
        ]);

        const { nome, numeroConta, saldo = 0 } = userData;
        const { fatura = 0, id, transacoes = [] } = faturaData;

        // Atualiza elementos do DOM
        nomeUsuarioEl.textContent = nome || "Usuário";
        numeroContaEl.textContent = numeroConta || "----";
        saldoEl.textContent = formatCurrency(saldo);
        renderFatura(fatura, id);

        // Limpa histórico
=======
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

>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
        listaDebito.innerHTML = "";
        listaCredito.innerHTML = "";
        listaDebito.classList.add("hidden");
        listaCredito.classList.add("hidden");
        btnDebito.textContent = "Histórico de Débito";
        btnCredito.textContent = "Histórico de Crédito";
<<<<<<< HEAD

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

        console.log(`[DASHBOARD] Atualização concluída: saldo=${saldo}, fatura=${fatura}`);
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
      if (valorFatura <= 0) return abrirModal("Aviso", "<p>Não há fatura para pagar.</p>");
      const diaAtual = new Date().getDate();

      // === ANTECIPAÇÃO (antes do dia 30) ===
      if (diaAtual < 30) {
        abrirModal("Antecipar Fatura", `
          <div style="color:#fff;">
            <p>Valor total da fatura: <strong>${formatCurrency(valorFatura)}</strong></p>
            <label>Quanto deseja antecipar?</label>
            <input type="number" id="valorAnteciparInput" min="1" max="${valorFatura}" placeholder="Digite o valor (R$)" style="width:100%;padding:8px;margin:8px 0;border-radius:6px;border:none;outline:none;">
            <label>Forma de pagamento:</label>
            <select id="metodoPagamentoSelect" style="width:100%;padding:8px;margin:8px 0;border-radius:6px;border:none;outline:none;">
=======
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
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
              <option value="">Selecione</option>
              <option value="pix">Pix</option>
              <option value="saldo">Saldo da conta</option>
              <option value="boleto">Boleto</option>
              <option value="credito">Cartão de crédito</option>
            </select>
<<<<<<< HEAD
            <button id="confirmarAntecipacaoBtn" class="btn laranja" style="width:100%;margin-top:10px;">Confirmar Antecipação</button>
          </div>`);

        const confirmarBtn = document.getElementById("confirmarAntecipacaoBtn");
        confirmarBtn?.addEventListener("click", async () => {
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
=======
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
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
          } catch (err) {
            abrirModal("Erro", `<p>${err.message}</p>`);
          }
        });
<<<<<<< HEAD
        return;
      }

      // === PAGAMENTO (dia 30 ou depois) ===
      abrirModal("Pagamento de Fatura", `
        <p>Escolha o método para pagar <strong>${formatCurrency(valorFatura)}</strong>:</p>
        <div class="btn-group-modal">
          <button id="opSaldo" class="btn laranja">Saldo</button>
          <button id="opPix" class="btn laranja">Pix</button>
          <button id="opCredito" class="btn laranja">Crédito</button>
          <button id="opBoleto" class="btn laranja">Boleto</button>
        </div>`);

      document.getElementById("opSaldo")?.addEventListener("click", async () => {
        try {
          const res = await fetchData("/api/fatura/pagar", {
            method: "POST",
            body: JSON.stringify({ faturaId: faturaEl.dataset.id, valorPagamento: valorFatura, metodoPagamento: "saldo" })
          });
          abrirModal("Sucesso", `<p>${res.mensagem || "Pagamento realizado com sucesso!"}</p>`);
          await atualizarDashboardEFatura();
        } catch (err) {
          abrirModal("Erro", `<p>Falha ao pagar fatura: ${err.message}</p>`);
        }
      });
    });

    // === INICIALIZAÇÃO ===
    inicializarHistorico();
    await atualizarDashboardEFatura();
    setInterval(atualizarDashboardEFatura, 10 * 60 * 1000); // Atualiza a cada 10 min
  } catch (err) {
    console.error('[initDashboard] Erro:', err);
    abrirModal("Erro", "Falha ao carregar o dashboard. Faça login novamente.");
=======
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
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
<<<<<<< HEAD
  initDashboard().catch(() => {
    alert("Erro ao iniciar o dashboard. Faça login novamente.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });
=======
  initDashboard();
>>>>>>> 0b4937c6f5fae6624c5562e29774a1f85ba38dfb
});
