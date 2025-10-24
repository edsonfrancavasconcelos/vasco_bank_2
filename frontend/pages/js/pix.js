
import { abrirModal } from './modals.js';


export function initPixPage() {
  const btnEnviar = document.getElementById("btnPixEnviar");
  const btnCobrar = document.getElementById("btnPixCobrar");
  const btnAgendar = document.getElementById("btnPixAgendar");
  const btnCriarChave = document.getElementById("btnPixCriarChave");
  const btnVerChaves = document.getElementById("btnPixVerChaves");

  if (btnEnviar) {
    btnEnviar.addEventListener("click", () => {
      abrirModal("Enviar Pix", "<p>Formulário de envio Pix aqui</p>");
    });
  }

  if (btnCobrar) {
    btnCobrar.addEventListener("click", () => {
      abrirModal("Receber Pix", "<p>Formulário de cobrança Pix aqui</p>");
    });
  }

  if (btnAgendar) {
    btnAgendar.addEventListener("click", () => {
      abrirModal("Agendar Pix", "<p>Formulário de agendamento Pix aqui</p>");
    });
  }

  if (btnCriarChave) {
    btnCriarChave.addEventListener("click", () => {
      abrirModal("Criar Chave Pix", "<p>Formulário de criação de chave aqui</p>");
    });
  }

  if (btnVerChaves) {
    btnVerChaves.addEventListener("click", () => {
      abrirModal("Chaves Pix", "<p>Lista de chaves Pix será carregada aqui</p>");
    });
  }
}
