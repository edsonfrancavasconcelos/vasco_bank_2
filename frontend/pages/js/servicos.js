// frontend/pages/js/servicos.js

// Função que inicializa a página de serviços
export function initServicosPage() {
  console.log('Iniciando initServicosPage');
  
  const lista = document.getElementById("listaServicos");
  if (!lista) {
    console.error('Elemento listaServicos não encontrado');
    return;
  }

  // Array de serviços
  const servicos = [
    { nome: "Consultoria Financeira", icon: "fa-solid fa-chart-line", link: "consultoria.html" },
    { nome: "Gestão de Cartões", icon: "fa-solid fa-credit-card", link: "#" },
    { nome: "Pagamentos e Recargas", icon: "fa-solid fa-exchange-alt", link: "#" },
    { nome: "Contas Correntes e Poupança", icon: "fa-solid fa-piggy-bank", link: "#" },
    { nome: "Empréstimos e Financiamentos", icon: "fa-solid fa-hand-holding-usd", link: "#" },
    { nome: "Investimentos", icon: "fa-solid fa-coins", link: "#" },
    { nome: "Câmbio e Transferências Internacionais", icon: "fa-solid fa-building-columns", link: "#" },
    { nome: "Seguros", icon: "fa-solid fa-shield-alt", link: "seguros.html" },
    { nome: "Mobile Banking / App", icon: "fa-solid fa-mobile-screen-button", link: "#" },
    { nome: "Saques e Depósitos", icon: "fa-solid fa-money-bill-wave", link: "#" },
    { nome: "Cobrança e Faturas", icon: "fa-solid fa-file-invoice-dollar", link: "#" },
    { nome: "Consultoria Empresarial", icon: "fa-solid fa-handshake", link: "#" },
    { nome: "Contas PJ / Empresariais", icon: "fa-solid fa-building-columns", link: "#" },
    { nome: "Carteira Digital", icon: "fa-solid fa-wallet", link: "#" },
    { nome: "Planejamento Financeiro", icon: "fa-solid fa-bullseye", link: "#" },
    { nome: "Pagamento de Boletos", icon: "fa-solid fa-receipt", link: "#" },
    { nome: "Doações e Benefícios Sociais", icon: "fa-solid fa-hand-holding-heart", link: "#" },
    { nome: "Investimentos em Fundos", icon: "fa-solid fa-building-columns", link: "#" },
    { nome: "Previdência Privada", icon: "fa-solid fa-coins", link: "#" },
    { nome: "Conta Conjunta", icon: "fa-solid fa-users", link: "#" },
    { nome: "Produtos Premium / Private", icon: "fa-solid fa-gem", link: "#" },
    { nome: "Empréstimos Consignados", icon: "fa-solid fa-donate", link: "#" },
    { nome: "Programa de Fidelidade", icon: "fa-solid fa-piggy-bank", link: "#" },
    { nome: "Renegociação de Dívidas", icon: "fa-solid fa-recycle", link: "#" },
  ];

  // Renderiza lista
  lista.innerHTML = servicos.map(s => `
    <li class="servico">
      <a href="${s.link || '#'}">
        <i class="${s.icon}"></i> ${s.nome}
      </a>
    </li>
  `).join("");

  console.log('Lista de serviços renderizada');
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('Iniciando página de serviços');
  initServicosPage();
});
