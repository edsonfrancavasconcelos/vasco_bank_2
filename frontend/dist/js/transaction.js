document.addEventListener("DOMContentLoaded", () => {
  const sections = {
    recarga: document.getElementById("secRecarga"),
    deposito: document.getElementById("secDeposito"),
    pagamento: document.getElementById("secPagamento"),
    transferencia: document.getElementById("secTransferencia"),
  };

  function hideAllSections() {
    Object.values(sections).forEach((sec) => (sec.style.display = "none"));
    fecharModal();
  }

  function showSection(name) {
    hideAllSections();
    if (sections[name]) sections[name].style.display = "block";
  }

  function abrirModal(titulo, conteudoHTML, onConfirm) {
    const existingModal = document.getElementById("modalTransacao");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "modalTransacao";
    Object.assign(modal.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
    });

    modal.innerHTML = `
      <div style="background:#1e1e1e; padding:20px; border-radius:12px; width:350px; max-width:90vw; color:white; font-family:'Segoe UI', sans-serif; position:relative;">
        <h2 style="color:#ff6600; margin-top:0;">${titulo}</h2>
        <div id="modalContent" style="margin-bottom:15px;">${conteudoHTML}</div>
        <div id="modalResumo" style="display:none; background:#262626; padding:10px; border-radius:8px; margin-bottom:15px;">
          <h3 style="color:#ff6600; margin:0 0 10px 0;">Resumo da Transação</h3>
          <div id="resumoConteudo"></div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button id="btnCancelar" style="background:#555; border:none; padding:8px 15px; border-radius:6px; color:#ddd; cursor:pointer;">Cancelar</button>
          <button id="btnConfirmar" style="background:#ff6600; border:none; padding:8px 15px; border-radius:6px; color:#fff; cursor:pointer;">Confirmar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("btnCancelar").onclick = () => fecharModal();

    document.getElementById("btnConfirmar").onclick = async () => {
      document.getElementById("btnConfirmar").disabled = true;
      document.getElementById("btnCancelar").disabled = true;

      try {
        // onConfirm deve retornar os dados da transação para o resumo
        const dadosTransacao = await onConfirm();

        // Esconde conteúdo do form, mostra resumo
        document.getElementById("modalContent").style.display = "none";
        const resumoDiv = document.getElementById("modalResumo");
        const resumoConteudo = document.getElementById("resumoConteudo");

        // Limpa resumo antigo
        resumoConteudo.innerHTML = "";

        // Preenche resumo com todos os dados (chave: valor)
        for (const [chave, valor] of Object.entries(dadosTransacao)) {
          const chaveFormatada = chave.charAt(0).toUpperCase() + chave.slice(1).replace(/([A-Z])/g, " $1");
          resumoConteudo.innerHTML += `<p><strong>${chaveFormatada}:</strong> ${valor}</p>`;
        }

        resumoDiv.style.display = "block";

        // Espera 2 segundos, fecha modal e alerta sucesso
        setTimeout(() => {
          fecharModal();
          alert("✅ Transação realizada com sucesso!");
        }, 2000);
      } catch (err) {
        alert("Erro: " + (err.message || err));
        document.getElementById("btnConfirmar").disabled = false;
        document.getElementById("btnCancelar").disabled = false;
      }
    };
  }

  function fecharModal() {
    const modal = document.getElementById("modalTransacao");
    if (modal) modal.remove();
  }

  // Abre o formulário no modal para o tipo passado
  function abrirFormularioTransacao(tipo) {
    let conteudo = "";
    switch (tipo) {
      case "recarga":
        conteudo = `
          <label>Operadora:<br/>
            <select id="inputOperadora" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;">
              <option value="">Selecione</option>
              <option value="Vivo">Vivo</option>
              <option value="Claro">Claro</option>
              <option value="TIM">TIM</option>
              <option value="Oi">Oi</option>
            </select>
          </label><br/><br/>
          <label>Número do Celular:<br/>
            <input id="inputNumeroCelular" type="tel" placeholder="(DDD) 9xxxx-xxxx" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label><br/><br/>
          <label>Valor:<br/>
            <input id="inputValor" type="number" min="0.01" step="0.01" placeholder="R$ 10,00" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label>
        `;
        break;

      case "deposito":
        conteudo = `
          <label>Conta de Envio:<br/>
            <input id="inputContaOrigem" type="text" placeholder="Número da conta de envio" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
          </label><br/><br/>
          <label>Valor:<br/>
            <input id="inputValor" type="number" min="0.01" step="0.01" placeholder="R$ 100,00" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label>
        `;
        break;

      case "pagamento":
        conteudo = `
          <label>Código de Barras:<br/>
            <input id="inputCodigoBoleto" type="text" placeholder="Digite o código de barras" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label><br/><br/>
          <label>Valor:<br/>
            <input id="inputValor" type="number" min="0.01" step="0.01" placeholder="R$ 0,00" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label>
        `;
        break;

     case "transferencia":
  conteudo = `
    <label>Conta de Envio:<br/>
      <input id="inputContaOrigem" type="text" placeholder="Número da conta de envio" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
    </label><br/><br/>  
    <label>Conta de Destino:<br/>
      <input id="inputContaDestino" type="text" placeholder="Número da conta destino ou chave Pix" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
    </label><br/><br/>       
    <label>Valor:<br/>
      <input id="inputValor" type="number" min="0.01" step="0.01" placeholder="R$ 0,00" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
    </label>
  `;
  break;


      default:
        alert("Tipo de transação inválido.");
        return;
    }

    abrirModal(`Transação: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, conteudo, async () => {
      let body = {};
      const valorStr = document.getElementById("inputValor")?.value;

      if (!valorStr || Number(valorStr) <= 0) {
        alert("Informe um valor válido.");
        throw new Error("Valor inválido");
      }
      const valor = Number(valorStr);

      switch (tipo) {
        case "recarga":
          const operadora = document.getElementById("inputOperadora").value.trim();
          const numeroCelular = document.getElementById("inputNumeroCelular").value.trim();
          if (!operadora) {
            alert("Informe a operadora.");
            throw new Error("Operadora inválida");
          }
          if (!numeroCelular) {
            alert("Informe o número do celular.");
            throw new Error("Número celular inválido");
          }
          body = { operador: operadora, numeroCelular, valorRecarga: valor };
          break;

        case "deposito":
          const contaOrigemD = document.getElementById("inputContaOrigem").value.trim();
          if (!contaOrigemD) {
            alert("Informe a conta de envio.");
            throw new Error("Conta origem inválida");
          }
          body = { contaOrigem: contaOrigemD, valorDeposito: valor };
          break;

        case "pagamento":
          const codigoBoleto = document.getElementById("inputCodigoBoleto").value.trim();
          if (!codigoBoleto) {
            alert("Informe o código de barras.");
            throw new Error("Código boleto inválido");
          }
          body = { codigoBoleto, valorBoleto: valor };
          break;

        case "transferencia":
          const contaOrigemT = document.getElementById("inputContaOrigem").value.trim();
          const contaDestino = document.getElementById("inputContaDestino").value.trim();
          if (!contaOrigemT) {
            alert("Informe a conta de envio.");
            throw new Error("Conta origem inválida");
          }
          if (!contaDestino) {
            alert("Informe a conta destino ou chave Pix.");
            throw new Error("Conta destino inválida");
          }
          body = { contaOrigem: contaOrigemT, contaDestino, valorTransferencia: valor };
          break;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/transactions/${tipo}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(`Erro: ${json.error || "Erro desconhecido"}`);
        throw new Error(json.error || "Erro desconhecido");
      }

      // Retorna dados para resumo completo
      return {
        Tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        Valor: `R$ ${valor.toFixed(2)}`,
        ...body,
      };
    });
  }

  // Eventos para os botões que abrem modal com formulário
  document.getElementById("btnRecarga").onclick = () => abrirFormularioTransacao("recarga");
  document.getElementById("btnDeposito").onclick = () => abrirFormularioTransacao("deposito");
  document.getElementById("btnPagamento").onclick = () => abrirFormularioTransacao("pagamento");
  document.getElementById("btnTransferencia").onclick = () => abrirFormularioTransacao("transferencia");

  // Inicializa escondendo as seções e fechando modal
  hideAllSections();
});
