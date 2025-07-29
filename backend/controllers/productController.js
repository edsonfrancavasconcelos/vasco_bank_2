const Product = require('../models/Product');

const getProducts = async (req, res) => {
  try {
    let products = await Product.find();
    
    // Se o banco estiver vazio, retornar lista estática
    if (products.length === 0) {
      products = [
        { name: 'Conta Corrente', description: 'Conta digital para seu dia a dia, sem taxas ocultas.', price: 0, category: 'other', available: true },
        { name: 'Cartão de Crédito', description: 'Sem anuidade, cashback e benefícios exclusivos.', price: 0, category: 'other', available: true },
        { name: 'Empréstimos', description: 'Empréstimos pessoais e consignados com taxas baixas.', price: 0, category: 'loan', available: true },
        { name: 'Investimentos', description: 'Acesse renda fixa, variável, fundos e criptomoedas.', price: 0, category: 'investment', available: true },
        { name: 'Seguros', description: 'Proteja sua família com seguros de vida e patrimônio.', price: 0, category: 'insurance', available: true },
        { name: 'PIX', description: 'Transações instantâneas sem custo adicional.', price: 0, category: 'other', available: true },
        { name: 'Boletos', description: 'Gere boletos para cobranças e pagamentos facilitados.', price: 0, category: 'other', available: true },
        { name: 'Recarga de Celular', description: 'Faça recargas direto pelo app sem taxas extras.', price: 0, category: 'other', available: true },
        { name: 'Conta Digital', description: 'Abra sua conta 100% digital sem taxas.', price: 0, category: 'other', available: true },
        { name: 'TED e DOC', description: 'Envie dinheiro para qualquer banco.', price: 0, category: 'other', available: true },
        { name: 'Financiamento', description: 'Financiamento de imóveis e veículos com condições especiais.', price: 0, category: 'loan', available: true },
        { name: 'Câmbio', description: 'Compra e venda de moedas estrangeiras.', price: 0, category: 'other', available: true },
        { name: 'Pagamentos de Contas', description: 'Pague contas e boletos com poucos cliques.', price: 0, category: 'other', available: true },
        { name: 'Cashback', description: 'Ganhe dinheiro de volta em suas compras.', price: 0, category: 'other', available: true },
        { name: 'Cartão Virtual', description: 'Cartão seguro para compras online.', price: 0, category: 'other', available: true },
        { name: 'Gestão Financeira', description: 'Ferramentas para controlar seus gastos.', price: 0, category: 'other', available: true },
      ];
      await Product.insertMany(products);
      products = await Product.find();
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
};

module.exports = { getProducts };