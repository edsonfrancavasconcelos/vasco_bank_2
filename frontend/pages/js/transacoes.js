export function initTransacoesPage() {
  const menu = document.getElementById("menuTransacoes");
  const secContainer = document.getElementById("secContainer");
  const modalContainer = document.getElementById("modalContainer");
  const historicoContainer = document.getElementById("historicoContainer");
  const faturaCard = document.getElementById("faturaAtualCard");




  // Verificação de elementos obrigatórios
  const elementosObrigatorios = { menu, secContainer, modalContainer };
  const elementosFaltantes = Object.entries(elementosObrigatorios)
    .filter(([_, elem]) => !elem)
    .map(([chave]) => chave);

  if (elementosFaltantes.length > 0) {
    console.error("Elementos DOM obrigatórios não encontrados:", elementosFaltantes);
    if (modalContainer) {
      modalContainer.innerHTML = `
        <div class="erro-card">
          <p>Erro: Elementos obrigatórios ausentes: ${elementosFaltantes.join(', ')}</p>
          <p>Verifique o HTML da página.</p>
          <button class="btn-cinza" onclick="this.parentElement.parentElement.innerHTML=''">Fechar</button>
        </div>
      `;
    }
    return;
  }

  const operadoras = ["Vivo", "Claro", "TIM", "Oi", "Nextel"];
  const transacoes = [
    { id: "Recarga", nome: "Recarga de Celular", icon: "fa-mobile-alt" },
    { id: "Deposito", nome: "Depósito", icon: "fa-university" },
    { id: "Pagamento", nome: "Pagamento de Boleto", icon: "fa-file-invoice-dollar" },
    { id: "Transferencia", nome: "Transferência", icon: "fa-exchange-alt" },
  ];

  // Monta menu
  menu.innerHTML = transacoes.map(t => `
    <li>
      <button type="button" class="btn-laranja btn-full" data-transacao="${t.id}">
        <i class="fas ${t.icon}"></i> ${t.nome}
      </button>
    </li>
  `).join("");

  // Monta seções de transações
  secContainer.innerHTML = transacoes.map(t => `
    <section id="sec${t.id}" class="sec-transacao" style="display:none;">
      <h2><i class="fas ${t.icon}"></i> ${t.nome}</h2>
      <form id="form${t.id}" class="form-transacao">
        ${getFormFields(t.id, operadoras)}
        <label>Tipo de Operação</label>
        <select name="tipoOperacao" required>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
        </select>
        <button type="submit" class="btn-laranja">Avançar</button>
      </form>
    </section>
  `).join("");

  // Eventos de clique no menu
  menu.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.transacao;
      document.querySelectorAll(".sec-transacao").forEach(sec => sec.style.display = "none");
      const sec = document.getElementById(`sec${id}`);
      if (sec) sec.style.display = "block";
    });
  });

  // Eventos de submit dos formulários
  transacoes.forEach(t => {
    const form = document.getElementById(`form${t.id}`);
    if (form) {
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const dados = Object.fromEntries(new FormData(form).entries());
        mostrarResumo(t.nome, dados, async () => {
          await concluirTransacao(t.id, dados);
          form.reset();
        });
      });
    }
  });

  // Carrega histórico inicial
  if(historicoContainer) carregarHistorico();

  // ===================== FUNÇÕES =====================

  function mostrarResumo(nomeTransacao, dados, onConfirmar) {
    const hoje = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    modalContainer.innerHTML = `
      <div class="resumo-card">
        <h3>Resumo da ${nomeTransacao}</h3>
        <ul>
          ${Object.entries(dados).map(([key, value]) => value ? `<li><strong>${formatarLabel(key)}:</strong> ${key === "valor" ? `R$ ${Number(value).toFixed(2)}` : value}</li>` : "").join("")}
          <li><strong>Data:</strong> ${hoje}</li>
        </ul>
        <div class="acoes-resumo">
          <button id="btnCancelar" class="btn-cinza">Cancelar</button>
          <button id="btnConfirmar" class="btn-laranja">Concluir</button>
        </div>
      </div>
    `;
    document.getElementById("btnCancelar").addEventListener("click", () => modalContainer.innerHTML = "");
    document.getElementById("btnConfirmar").addEventListener("click", async () => { modalContainer.innerHTML = ""; await onConfirmar(); });
  }

  async function carregarHistorico() {
    try {
      historicoContainer.innerHTML = '<p class="carregando">Carregando...</p>';
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) { window.location.href = "/login.html"; throw new Error("Usuário não autenticado"); }

      const res = await fetch("http://localhost:3000/api/user/me/historico", {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      });

      const response = await res.json();
      if (!res.ok) throw new Error(response.error || "Erro ao carregar histórico");

      const transacoesData = Array.isArray(response.data) ? response.data : [];
      if (transacoesData.length === 0) {
        historicoContainer.innerHTML = "<p>Nenhuma transação disponível.</p>";
        if (faturaCard) faturaCard.textContent = `Fatura Atual: R$ 0,00`;
        return;
      }

      let saldoAtual = 0;
      historicoContainer.innerHTML = transacoesData.map(t => {
        const tipoOp = (t.tipoOperacao || 'debito').toLowerCase();
        const valor = Number(t.valor || 0);

        if (tipoOp === 'debito') saldoAtual -= valor;
        else saldoAtual += valor;

        return `
          <div class="historico-item">
            <span>${new Date(t.data).toLocaleString('pt-BR')}</span>
            <span>${t.descricao || t.tipo}</span>
            <span>${tipoOp === 'debito' ? '-' : '+'} R$ ${valor.toFixed(2)}</span>
          </div>
        `;
      }).join("");

      if (faturaCard) faturaCard.textContent = `Fatura Atual: R$ ${saldoAtual.toFixed(2)}`;
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      historicoContainer.innerHTML = `<p class="erro">Não foi possível carregar o histórico: ${err.message}</p>`;
      if (faturaCard) faturaCard.textContent = `Fatura Atual: R$ 0,00`;
    }
  }

  async function concluirTransacao(tipo, dados) {
    try {
      modalContainer.innerHTML = '<p class="carregando">Processando...</p>';
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) { window.location.href = "/login.html"; throw new Error("Usuário não autenticado"); }

      const tipoMap = { Recarga: "recarga", Deposito: "deposito", Pagamento: "pagamento_boleto", Transferencia: "transferencia" };
      const tiposValidos = Object.values(tipoMap);
      const tipoEnviado = tipoMap[tipo] || tipo.toLowerCase();
      if (!tiposValidos.includes(tipoEnviado)) throw new Error(`Tipo de transação inválido: ${tipoEnviado}`);

      let payload = { tipo: tipoEnviado, tipoOperacao: dados.tipoOperacao || "debito" };
      const valorNum = Number(dados.valor);
      if (isNaN(valorNum) || valorNum <= 0) throw new Error("O valor deve ser um número positivo");
      payload.valor = valorNum;

      if (tipo === "Recarga") {
        if (!dados.numeroCelular || !dados.operador) throw new Error("Campos obrigatórios para Recarga");
        const numeroLimpo = dados.numeroCelular.replace(/\D/g, "");
        if (!/^\d{11}$/.test(numeroLimpo)) throw new Error("Número de celular inválido");
        payload.numeroCelular = numeroLimpo;
        payload.operador = dados.operador;
      }
      if (tipo === "Transferencia") { 
        if (!dados.contaDestino) throw new Error("Conta de destino obrigatória"); 
        payload.contaDestino = dados.contaDestino; 
        payload.contaOrigem = dados.contaOrigem || ""; 
      }
      if (tipo === "Deposito") { 
        if (!dados.contaOrigem) throw new Error("Conta de origem obrigatória"); 
        payload.contaOrigem = dados.contaOrigem; 
        payload.contaDestino = dados.contaDestino || ""; 
      }
      if (tipo === "Pagamento") { 
        if (!dados.descricao) throw new Error("Descrição obrigatória"); 
        payload.descricao = dados.descricao; 
      }

      console.log("Payload enviado:", payload);

      const res = await fetch("http://localhost:3000/api/transactions/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Erro ao processar transação");

      modalContainer.innerHTML = `
        <div class="sucesso-card">
          ✅ ${tipo} realizada com sucesso!
          <button class="btn-cinza" onclick="this.parentElement.parentElement.innerHTML=''">Fechar</button>
        </div>
      `;

      if (historicoContainer) carregarHistorico();
    } catch (err) {
      modalContainer.innerHTML = `
        <div class="erro-card">
          ❌ Erro: ${err.message}
          <button class="btn-cinza" onclick="this.parentElement.parentElement.innerHTML=''">Fechar</button>
        </div>
      `;
    }
  }

  function getFormFields(tipo, operadoras) {
    switch (tipo) {
      case "Recarga": return `
        <label>Número do Celular</label>
        <input type="text" name="numeroCelular" required placeholder="Digite o número do celular">
        <label>Operadora</label>
        <select name="operador" required>${operadoras.map(op => `<option value="${op}">${op}</option>`).join("")}</select>
        <label>Valor</label>
        <input type="number" name="valor" required placeholder="R$ 0,00" min="0.01" step="0.01">
      `;
      case "Deposito": return `
        <label>Valor do Depósito</label>
        <input type="number" name="valor" required placeholder="R$ 0,00" min="0.01" step="0.01">
        <label>Conta de Origem</label>
        <input type="text" name="contaOrigem" required placeholder="Digite a Conta de origem">
        <label>Conta Destino</label>
        <input type="text" name="contaDestino" required placeholder="Digite a Conta destino">
      `;
      case "Pagamento": return `
        <label>Código de Barras</label>
        <input type="text" name="descricao" required placeholder="Digite o código de barras">
        <label>Valor</label>
        <input type="number" name="valor" required placeholder="R$ 0,00" min="0.01" step="0.01">
      `;
      case "Transferencia": return `
        <label>Conta de Origem</label>
        <input type="text" name="contaOrigem" required placeholder="Digite a Conta de Origem">
        <label>Conta de Destino</label>
        <input type="text" name="contaDestino" required placeholder="Digite a Conta destino">
        <label>Valor</label>
        <input type="number" name="valor" required placeholder="R$ 0,00" min="0.01" step="0.01">
      `;
      default: return "<p>Formulário não disponível.</p>";
    }
  }

  function formatarLabel(campo) {
    const labels = {
      numeroCelular: "Celular",
      operador: "Operadora",
      valor: "Valor",
      contaOrigem: "Conta Origem",
      descricao: "Código/Descrição",
      contaDestino: "Conta Destino",
      tipoOperacao: "Tipo de Operação",
    };
    return labels[campo] || campo;
  }
}

// Inicializa automaticamente ao carregar página
document.addEventListener("DOMContentLoaded", () => initTransacoesPage());


