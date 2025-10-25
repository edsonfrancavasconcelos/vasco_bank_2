// -----------------------------
// Fecha qualquer modal existente
// -----------------------------
export function fecharModal() {
  const modais = ['modalPix', 'modalPixResumo'];
  modais.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

// -----------------------------
// Abre modal genérico com botão Submeter
// -----------------------------
export function abrirModal(titulo, conteudoHTML, onSubmit) {
  fecharModal();

  const modal = document.createElement("div");
  modal.id = "modalPix";
  Object.assign(modal.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  });

  modal.innerHTML = `
    <div style="background:#1e1e1e; padding:20px; border-radius:12px; width:400px; max-width:90vw; color:white; font-family:'Segoe UI', sans-serif; position:relative;">
      <h2 style="color:#ff6600; margin-top:0;">${titulo}</h2>
      <div id="modalContent" style="margin-bottom:15px;">${conteudoHTML}</div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button id="btnCancelar" style="background:#555; border:none; padding:8px 15px; border-radius:6px; color:#ddd; cursor:pointer;">Cancelar</button>
        <button id="btnSubmeter" style="background:#ff6600; border:none; padding:8px 15px; border-radius:6px; color:#fff; cursor:pointer;">Submeter</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Eventos
  document.getElementById("btnCancelar").onclick = fecharModal;

  document.getElementById("btnSubmeter").onclick = async () => {
    try {
      if (onSubmit) {
        const dados = await onSubmit();

        // Caso o backend retorne erro controlado
        if (dados && dados.success === false) {
          console.warn("⚠️ Erro do backend:", dados.error || dados.mensagem);
          alert(`Erro: ${dados.error || dados.mensagem || "Operação não concluída."}`);
          return;
        }

        console.log("✅ Resposta do modal:", dados);
        fecharModal();
        return dados;
      } else {
        fecharModal();
      }
    } catch (err) {
      console.error("🔥 Erro no modal:", err);
      alert("Erro: " + (err?.message || err));
    }
  };
}

// -----------------------------
// Modal de resumo para Pix ou qualquer transação
// -----------------------------
export function abrirResumoModal(dados) {
  fecharModal();

  let conteudoHTML = `<strong>${dados.Tipo || "Transação"}</strong><br>`;
  for (const [k, v] of Object.entries(dados)) {
    if (k === "QR" && (dados.Tipo || "").includes("Pix")) {
      conteudoHTML += `
        <div style="text-align:center;">
          <img src="${v}" style="max-width:200px; margin:10px 0;">
          <br>
          <button id="btnCopyQR" data-chave="${dados.Chave || ''}" style="background:#ff6600; border:none; padding:5px 10px; border-radius:5px; color:#fff; cursor:pointer;">Copiar Chave</button>
          <button id="btnCopyPayload" data-payload="${dados['Código QR'] || ''}" style="background:#ff6600; border:none; padding:5px 10px; border-radius:5px; color:#fff; cursor:pointer; margin-left:5px;">Copiar Código QR</button>
        </div>`;
    } else if (k !== "Tipo" && k !== "QR") {
      conteudoHTML += `<strong>${k}:</strong> ${v}<br>`;
    }
  }

  const modal = document.createElement("div");
  modal.id = "modalPixResumo";
  Object.assign(modal.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  });

  modal.innerHTML = `
    <div style="background:#1e1e1e; padding:20px; border-radius:12px; width:400px; max-width:90vw; color:white; font-family:'Segoe UI', sans-serif; position:relative;">
      <h2 style="color:#ff6600; margin-top:0;">Resumo da Transação</h2>
      <div style="margin-bottom:15px;">${conteudoHTML}</div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button id="btnConcluir" style="background:#ff6600; border:none; padding:8px 15px; border-radius:6px; color:#fff; cursor:pointer;">Concluir</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Eventos de copiar
  const btnCopyQR = document.getElementById("btnCopyQR");
  if (btnCopyQR) btnCopyQR.onclick = () => {
    navigator.clipboard.writeText(btnCopyQR.dataset.chave);
    alert("Chave copiada!");
  };

  const btnCopyPayload = document.getElementById("btnCopyPayload");
  if (btnCopyPayload) btnCopyPayload.onclick = () => {
    navigator.clipboard.writeText(btnCopyPayload.dataset.payload);
    alert("Código QR copiado!");
  };

  // Concluir
  document.getElementById("btnConcluir").onclick = fecharModal;
}

// -----------------------------
// Modal de escolha Saldo ou Crédito (fatura)
// -----------------------------
export function confirmarOperacao(tipoOperacao, valor) {
  return new Promise((resolve) => {
    abrirModal(
      'Confirmação de Operação',
      `<p>Deseja realizar a operação <b>${tipoOperacao}</b> no valor de ${new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(valor)} usando:</p>`,
      null // Botões customizados abaixo
    );

    const modal = document.getElementById('modalPix');
    if (!modal) return;

    const botoesContainer = modal.querySelector('div[style*="justify-content:flex-end"]');
    if (!botoesContainer) return;

    botoesContainer.innerHTML = `
      <button id="btnSaldo" style="background:#ff6600; border:none; padding:8px 15px; border-radius:6px; color:#fff; cursor:pointer;">Saldo</button>
      <button id="btnCredito" style="background:#555; border:none; padding:8px 15px; border-radius:6px; color:#ddd; cursor:pointer;">Crédito</button>
      <button id="btnCancelar" style="background:#333; border:none; padding:8px 15px; border-radius:6px; color:#fff; cursor:pointer;">Cancelar</button>
    `;

    document.getElementById('btnSaldo').onclick = () => {
      fecharModal();
      resolve('saldo');
    };
    document.getElementById('btnCredito').onclick = () => {
      fecharModal();
      resolve('credito');
    };
    document.getElementById('btnCancelar').onclick = () => {
      fecharModal();
      resolve(null);
    };
  });
}
