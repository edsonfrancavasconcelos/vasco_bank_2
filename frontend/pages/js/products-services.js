document.addEventListener("DOMContentLoaded", function () {
  const productsList = document.getElementById("products-list");
  if (!productsList) return;

  const products = [
   
     {
      title: "Conta Digital",
      description: "Abra sua conta 100% digital sem taxas.",
      image: "cartao-credito.png",
      href: "../conta-digital.html"
    },
     {
      title: "Cartão de Crédito",
      description: "Sem anuidade, cashback e benefícios exclusivos",
      image: "cartao-credito.png",
      href: "../credito.html"
    },
     {
      title: "Cartão Virtual",
      description: "Cartão seguro para compras online.",
      image: "cartao-credito.png",
      href: "../cartao-virtual.html"
    },
    {
      title: "Empréstimos",
      description: "Empréstimos pessoais e consignados com taxas baixas.",
      image: "emprestimos.jpg",
      href: "../emprestimos.html"
    },
    {
      title: "Investimentos",
      description: "Acesse renda fixa, variável, fundos e criptomoedas.",
      image: "investimentos.jpg",
      href: "../investimentos.html"
    },
     {
      title: "Financiamento",
      description: "Financiamento de imóveis e veículos com condições especiais.",
      image: "vascobank-auto.jpg",
      href: "../financiamento.html"
    },
    {
      title: "Seguros",
      description: "Proteja sua família com seguros de vida e patrimônio.",
      image: "seguros.jpg",
      href: "../seguros.html"
    },
    {
      title: "PIX",
      description: "Transações instantâneas sem custo adicional.",
      image: "pix.jpg",
      href: "../pix.html"
    },
    {
      title: "Recarga de Celular",
      description: "Faça recargas direto pelo app sem taxas extras.",
      image: "recarga.jpg",
      href: "../recarga-celular.html"
    },  
    
    {
      title: "Pagamentos de Contas",
      description: "Pague contas e boletos com poucos cliques.",
      image: "boletos.jpg",
      href: "../pagamentos-contas.html"
    },
   
    {
      title: "Gestão Financeira",
      description: "Ferramentas para controlar seus gastos.",
      image: "servicos-produtos.jpeg",
      href: "../gestao-financeira.html"
    }
  ];

  productsList.innerHTML = '';

  products.forEach(({ title, description, image, href }) => {
    const imagePath = `./image/${image}`; // Ajuste o caminho conforme necessário

    const productCard = document.createElement("div");
    productCard.className = "col-md-4 mb-4";

    productCard.innerHTML = `
      <a href="${href}" class="text-decoration-none">
        <div class="card h-100 shadow-sm p-3 text-center" style="background-color: #1e1e1e; color: #fff; border: none; border-radius: 12px; transition: transform 0.2s;">
          <img src="${imagePath}" alt="${title}" style="max-width: 80px; margin: 0 auto 1rem; display: block;" onerror="this.src='./image/vbank.png'">
          <h5 class="card-title" style="font-weight: 600;">${title}</h5>
          <p class="card-text" style="font-size: 0.95rem; color: #ccc;">${description}</p>
        </div>
      </a>
    `;

    productCard.querySelector('.card').addEventListener('mouseover', function () {
      this.style.transform = 'scale(1.05)';
    });
    productCard.querySelector('.card').addEventListener('mouseout', function () {
      this.style.transform = 'scale(1)';
    });

    productsList.appendChild(productCard);
  });
});