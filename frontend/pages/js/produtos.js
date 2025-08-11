window.onload = async () => {
  const ul = document.getElementById('listaProdutos');
  const produtos = ['Conta Corrente', 'Cartão de Crédito', 'Investimentos'];

  produtos.forEach((produto) => {
    const li = document.createElement('li');
    li.textContent = produto;
    ul.appendChild(li);
  });
};
