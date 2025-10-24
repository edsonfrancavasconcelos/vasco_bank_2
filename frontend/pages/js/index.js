// frontend/pages/js/index.js
import { atualizarSaldo } from './saldo.js';
import { carregarHistorico } from './historico.js';
import { initTransacoes } from './transacoes.js';
import { abrirFormularioPix } from './forms.js';

document.addEventListener('DOMContentLoaded', () => {
  const bodyClass = document.body.className;

  if (bodyClass.includes('dashboard')) {
    // Somente no dashboard
    import('./dashboard.js').then(module => {
      module.initDashboard().catch(err => {
        console.error("Erro ao iniciar dashboard:", err);
        localStorage.removeItem('token');
        alert("Não foi possível carregar o dashboard. Faça login novamente.");
        window.location.href = "login.html";
      });
    });
  }

  // Inicializações comuns (funcionam em todas as páginas)
  atualizarSaldo();
  carregarHistorico();
  initTransacoes();

  // Mapear botões de Pix para seus formulários
  const btnMap = {
    btnPixEnviar: "enviar",
    btnPixCobrar: "cobrar",
    btnPixAgendar: "agendar",
    btnPixCriarChave: "criarChave",
    btnPixVerChaves: "verChaves"
  };

  Object.entries(btnMap).forEach(([btnId, tipo]) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener("click", () => abrirFormularioPix(tipo));
  });
});
