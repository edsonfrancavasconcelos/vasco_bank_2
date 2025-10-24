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

    // === FETCH PADRÃO COM TRATAMENTO DE ERRO ===
    async function fetchData(url, options = {}) {
      const res = await fetchWithAuth(url, options);
      if (!res) throw new Error("Resposta vazia do servidor.");
      if (!res.success) throw new Error(res.error || res.message || "Erro do servidor.");
      return res.data ?? res;
    }

    // === ATUALIZA DADOS PRINCIPAIS ===
    async function atualizarDashboard() {
      try {
        const data = await fetchData("/api/user/me");
        const { nome, numeroConta, saldo = 0, fatura = 0 } = data;

        nomeUsuarioEl.textContent = nome || "Usuário";
        numeroContaEl.textContent = numeroConta || "----";
        saldoEl.textContent = formatCurrency(saldo);

        faturaEl.dataset.valor = fatura;
        const diaAtual = new Date().getDate();

        if (fatura > 0) {
          faturaEl.textContent =
            diaAtual >= 30
              ? `Pagar Fatura: ${formatCurrency(fatura)}`
              : `Fatura aberta: ${formatCurrency(fatura)}`;
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

    // === ATUALIZA SALDO DA FATURA ===
    async function atualizarSaldoFatura() {
      try {
        const registros = await fetchData("/api/user/me/historico?tipo=credito");
        const saldo = Array.isArray(registros) ? registros.reduce((acc, item) => acc + Number(item.valor || 0), 0) : 0;
        const diaAtual = new Date().getDate();

        faturaEl.dataset.valor = saldo;
        faturaEl.textContent =
          diaAtual >= 30
            ? `Pagar Fatura: ${formatCurrency(saldo)}`
            : `Fatura aberta: ${formatCurrency(saldo)}`;
        faturaEl.classList.toggle("pagar-fatura", diaAtual >= 30);
      } catch (err) {
        console.error("Erro ao atualizar saldo da fatura:", err);
      }
    }

    // === REVELAR / ESCONDER HISTÓRICO ===
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
      if (isNaN(valorFatura) || valorFatura <= 0) return abrirModal("Aviso", "<p>Não há fatura para pagar.</p>");

      const diaAtual = new Date().getDate();

      if (diaAtual < 30) {
        // Antecipar fatura
        abrirModal(
          "Antecipar Fatura",
          `
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
            <button id="confirmarAntecipacaoBtn" class="btn laranja" style="width:100%;margin-top:10px;">💰 Confirmar Antecipação</button>
          </div>`
        );

        const btnConfirmar = document.getElementById("confirmarAntecipacaoBtn");
        const inputValor = document.getElementById("valorAnteciparInput");
        const selectMetodo = document.getElementById("metodoPagamentoSelect");

    btnConfirmar?.addEventListener("click", async () => {
  const valor = parseFloat(inputValor.value);
  const metodoPagamento = selectMetodo.value;

  if (isNaN(valor) || valor <= 0 || valor > valorFatura)
    return abrirModal("Erro", "<p>Informe um valor válido para antecipar.</p>");
  if (!metodoPagamento)
    return abrirModal("Erro", "<p>Selecione uma forma de pagamento.</p>");

  try {
    // ⚡ Enviando o campo correto 'valor' que o backend espera
    const res = await fetch("/api/user/faturas/antecipar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ valor, metodoPagamento }), // <--- aqui
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.mensagem || "Erro ao antecipar fatura.");

    abrirModal("Sucesso", `<p>${data.mensagem || "Fatura antecipada com sucesso!"}</p>`);

    // Atualiza visualmente a fatura
    const novoSaldo = valorFatura - valor;
    faturaEl.dataset.valor = novoSaldo;
    faturaEl.textContent = `Fatura aberta: ${formatCurrency(novoSaldo)}`;

    await atualizarSaldoFatura();
    await atualizarDashboard();
  } catch (err) {
    abrirModal("Erro", `<p>${err.message}</p>`);
  }
});


        return;
      }

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

      document.getElementById("opPDF")?.addEventListener("click", async () => {
        try {
          const res = await fetch("/api/user/fatura/pdf", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
          const blob = await res.blob();
          const pdfUrl = URL.createObjectURL(blob);
          window.open(pdfUrl, "_blank");
        } catch (err) {
          console.error("Erro ao gerar PDF:", err);
          abrirModal("Erro", `<p>Falha ao gerar PDF: <strong>${err.message}</strong></p>
            <button id="gerarPdfLocal" class="btn laranja">Gerar PDF Local</button>`);
          document.getElementById("gerarPdfLocal")?.addEventListener("click", async () => {
            let detalhes = {};
            try { const resp = await fetchData("/api/fatura/detalhes"); detalhes = resp?.data ?? {}; } catch {}
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

  } catch (err) {
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
