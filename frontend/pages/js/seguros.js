// frontend/pages/js/seguros.js
export function initSegurosPage() {
  const lista = document.getElementById("listaSeguros");
  if (!lista) return;

  // ================= Seguros =================
  const seguros = [
    { titulo: "Seguro de Vida", descricao: "Tranquilidade para você e sua família com cobertura nacional.", link: "createUser.html", icon: "fa-heartbeat" },
    { titulo: "Seguro Auto", descricao: "Proteção para seu veículo com assistência 24h e coberturas personalizadas.", link: "createUser.html", icon: "fa-car" },
    { titulo: "Seguro Residencial", descricao: "Cobertura contra incêndio, roubo e danos para seu lar e patrimônio.", link: "createUser.html", icon: "fa-house" },
    { titulo: "Seguro Saúde", descricao: "Atendimento de qualidade, reembolso e planos familiares acessíveis.", link: "createUser.html", icon: "fa-briefcase-medical" },
    { titulo: "Seguro Viagem", descricao: "Viaje tranquilo com cobertura global e assistência internacional.", link: "createUser.html", icon: "fa-plane" },
    { titulo: "Seguro Pessoal", descricao: "Proteção contra imprevistos do dia a dia, incluindo acidentes e emergências.", link: "createUser.html", icon: "fa-user-shield" },
    { titulo: "Seguro Empresarial", descricao: "Cobertura completa para o seu negócio e equipe, com assistência 24h.", link: "createUser.html", icon: "fa-briefcase" },
    { titulo: "Seguro Náutico", descricao: "Proteção para embarcações, equipamentos e passageiros com cobertura nacional.", link: "createUser.html", icon: "fa-ship" }
  ];

  // ================= Renderiza os cards =================
  lista.innerHTML = seguros.map(seguro => `
    <div class="seguro-card">
      <i class="fa-solid ${seguro.icon} fa-3x"></i>
      <h2>${seguro.titulo}</h2>
      <p>${seguro.descricao}</p>
      <a href="${seguro.link}" class="btn-laranja">Saiba Mais</a>
    </div>
  `).join("");
}

// ================= Inicialização automática =================
document.addEventListener('DOMContentLoaded', () => {
  initSegurosPage();
});
