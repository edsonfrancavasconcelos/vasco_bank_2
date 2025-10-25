// produtos.js
export function initProdutosPage() {
  const lista = document.querySelector(".lista-servicos");
  if (!lista) return;

  const servicos = [
    {
      titulo: "Cartão VascoBank Platinum",
      descricao: "Com benefícios exclusivos, sem anuidade e aceito em todo o mundo.",
      link: "createUser.html",
      icon: "fa-credit-card"
    },
    {
      titulo: "Conta Digital",
      descricao: "Gratuita, prática e com transferências ilimitadas via Pix.",
      link: "createUser.html",
      icon: "fa-wallet"
    },
    {
      titulo: "Seguro de Vida",
      descricao: "Proteção completa para sua família com valores acessíveis.",
      link: "createUser.html",
      icon: "fa-shield-alt"
    },
    {
      titulo: "Investimentos Automatizados",
      descricao: "Renda fixa e variável com curadoria de IA e acompanhamento em tempo real.",
      link: "investimentos.html",
      icon: "fa-chart-line"
    }
  ];

  lista.innerHTML = servicos.map(s => `
    <li class="servico">
      <a href="${s.link}">
        <i class="fas ${s.icon}"></i>
        <strong>${s.titulo}</strong>
        <span>${s.descricao}</span>
      </a>
    </li>
  `).join("");
}
