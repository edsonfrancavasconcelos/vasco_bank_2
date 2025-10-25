// forms.js
import { abrirModal } from './modals.js';
import { criarCardPix } from './cards.js';

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function abrirFormularioPix(tipo) {
  let conteudo = "";
  switch (tipo) {
    case "enviar":
      conteudo = `<label>Valor:</label><input id="valor" type="number" min="0.01" step="0.01"> ...`;
      abrirModal("Enviar Pix", conteudo, async () => {
        const valor = document.getElementById("valor").value;
        const chaveDestino = document.getElementById("chaveDestino").value;
        if (!valor || !chaveDestino) throw new Error("Valor e chave obrigatórios");
        const res = await fetchWithAuth("/api/pix/enviar", { method: "POST", body: JSON.stringify({ valor, chaveDestino }) });
        if (!res.success) throw new Error(res.error);
        const dados = { Tipo: "Pix Enviado", Chave: res.data.chave, Valor: valor, QR: res.data.qr, "Código QR": res.data.payload };
        criarCardPix(dados);
        return dados;
      });
      break;
    // repetir cases "cobrar", "agendar", "criarChave", "verChaves"...
  }
}
