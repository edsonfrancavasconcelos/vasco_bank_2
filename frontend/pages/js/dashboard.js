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

    // === FUNÇÃO ÚNICA PARA RENDERIZAR FATURA ===
    function renderFatura(valor) {
      const diaAtual = new Date().getDate();
      faturaEl.dataset.valor = valor;
      if (valor > 0) {
        faturaEl.textContent = diaAtual >= 30
          ? `Pagar Fatura: ${formatCurrency(valor)}`
          : `Fatura aberta: ${formatCurrency(valor)}`;
        faturaEl.classList.toggle("pagar-fatura", diaAtual >= 30);
      } else {
        faturaEl.textContent = formatCurrency(0);
        faturaEl.classList.remove("pagar-fatura");
      }
    }

    // === ATUALIZA DASHBOARD PRINCIPAL ===
    async function atualizarDashboard() {
      try {
        const data = await fetchData("/api/user/me");
        const { nome, numeroConta, saldo = 0, fatura = 0 } = data;

        nomeUsuarioEl.textContent = nome || "Usuário";
        numeroContaEl.textContent = numeroConta || "----";
        saldoEl.textContent = formatCurrency(saldo);

        renderFatura(fatura);

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

    // === ATUALIZA SALDO DA FATURA (somente créditos) ===
    async function atualizarSaldoFatura() {
      try {
        const registros = await fetchData("/api/fatura/credito");
        const saldo = Array.isArray(registros)
          ? registros.reduce((acc, item) => acc + Number(item.valor || 0), 0)
          : 0;
        renderFatura(saldo);
      } catch (err) {
        console.error("Erro ao atualizar saldo da fatura:", err);
      }
    }

    // === TOGGLE HISTÓRICO DE DÉBITO / CRÉDITO ===
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
          const data = await fetchData(`/api/historico/${tipo}`);
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

    // === GERAR PDF LOCAL ===
    function gerarPdfLocal(valorFatura, detalhes = {}) {
      const janela = window.open("", "_blank", "noopener,noreferrer");
      if (!janela) return abrirModal("Erro", "<p>Não foi possível abrir nova aba para gerar PDF.</p>");

      const hoje = new Date();
      const fechamento = new Date(hoje.getFullYear(), hoje.getMonth(), 30);
      const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 5);

      const itens = detalhes?.itens || [];
      const itensHtml = itens.length
        ? itens.map(it => `<tr><td>${it.descricao || "Item"}</td><td style="text-align:right">${formatCurrency(it.valor || 0)}</td></tr>`).join("")
        : `<tr><td colspan="2" style="text-align:center">Nenhum detalhe disponível</td></tr>`;

      const html = `
        <html><head>
          <title>Fatura - ${formatCurrency(valorFatura)}</title>
          <style>
            body{font-family:Arial;margin:20px;color:#111}
            table{width:100%;border-collapse:collapse;margin-top:16px}
            td,th{border:1px solid #ddd;padding:8px}
            th{background:#f7f7f7}
            .btn{background:#ff7b00;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer}
          </style>
        </head><body>
          <h2>Resumo da Fatura - ${formatCurrency(valorFatura)}</h2>
          <p>Fechamento: ${fechamento.toLocaleDateString()}</p>
          <p>Vencimento: ${vencimento.toLocaleDateString()}</p>
          <table>
            <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
            <tbody>${itensHtml}</tbody>
          </table>
          <div style="margin-top:20px;text-align:right">
            <button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button>
          </div>
        </body></html>`;
      janela.document.write(html);
      janela.document.close();
    }

    // === CLIQUE NA FATURA ===
    faturaEl.addEventListener("click", async () => {
      const valorFatura = parseFloat(faturaEl.dataset.valor || 0);
      if (isNaN(valorFatura) || valorFatura <= 0) {
        return abrirModal("Aviso", "<p>Não há fatura para pagar.</p>");
      }

      const diaAtual = new Date().getDate();

      // ---------------- ANTECIPAÇÃO (antes do dia 30) ----------------
      if (diaAtual < 30) {
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

        let faturaId;
        try {
          const resFatura = await fetchData("/api/fatura/atual");
          faturaId = resFatura?.id;
          if (!faturaId) throw new Error("Nenhuma fatura aberta para antecipar.");
        } catch (e) {
          return abrirModal("Erro", `<p>${e.message}</p>`);
        }

        document.getElementById("confirmarAntecipacaoBtn")?.addEventListener("click", async () => {
          const valor = parseFloat(document.getElementById("valorAnteciparInput").value);
          const metodoPagamento = document.getElementById("metodoPagamentoSelect").value;

          if (isNaN(valor) || valor <= 0 || valor > valorFatura) return abrirModal("Erro", "<p>Informe um valor válido para antecipar.</p>");
          if (!metodoPagamento) return abrirModal("Erro", "<p>Selecione uma forma de pagamento.</p>");

          try {
            const res = await fetchData("/api/fatura/antecipar", {
              method: "POST",
              body: JSON.stringify({ faturaId, valor, metodoPagamento })
            });
            abrirModal("Sucesso", `<p>${res.mensagem || "Antecipação realizada com sucesso!"}</p>`);
            await atualizarSaldoFatura();
            await atualizarDashboard();
          } catch (err) {
            abrirModal("Erro", `<p>${err.message}</p>`);
          }
        });
        return;
      }

      // ---------------- PAGAMENTO (dia 30 ou depois) ----------------
      abrirModal("Pagamento de Fatura", `
        <p>Escolha o método para pagar <strong>${formatCurrency(valorFatura)}</strong>:</p>
        <div class="btn-group-modal">
          <button id="opSaldo" class="btn laranja">Saldo</button>
          <button id="opPix" class="btn laranja">Pix</button>
          <button id="opCredito" class="btn laranja">Crédito</button>
          <button id="opBoleto" class="btn laranja">Boleto</button>
          <button id="opPDF" class="btn cinza">Gerar PDF</button>
        </div>`);

      document.getElementById("opPDF")?.addEventListener("click", async () => {
        try {
          const res = await fetch(`/api/fatura/pdf/${faturaEl.dataset.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) throw new Error(`Erro ${res.status}`);
          const blob = await res.blob();
          window.open(URL.createObjectURL(blob), "_blank");
        } catch (err) {
          abrirModal("Erro", `<p>Falha ao gerar PDF: ${err.message}</p><button id="gerarPdfLocal" class="btn laranja">Gerar PDF Local</button>`);
          document.getElementById("gerarPdfLocal")?.addEventListener("click", async () => {
            let detalhes = {};
            try { detalhes = await fetchData("/api/fatura/detalhes"); } catch {}
            gerarPdfLocal(valorFatura, detalhes);
          });
        }
      });
    });

    // === INICIALIZAÇÃO ===
    inicializarHistorico();
    await atualizarDashboard();
    await atualizarSaldoFatura();

    setInterval(async () => {
      await atualizarDashboard();
      await atualizarSaldoFatura();
    }, 10 * 60 * 1000);

  } catch {
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
