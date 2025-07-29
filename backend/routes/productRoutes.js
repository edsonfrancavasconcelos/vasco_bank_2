const express = require("express");
const router = express.Router();
const { getProducts } = require('../controllers/productController');



router.get("/", getProducts);{
  const products = [
    {
      name: "Conta Corrente",
      description: "Conta digital para seu dia a dia, sem taxas ocultas.",
    },
    {
      name: "Cartão de Crédito",
      description: "Sem anuidade, cashback e benefícios exclusivos.",
    },
    {
      name: "Empréstimos",
      description: "Empréstimos pessoais e consignados com taxas baixas.",
    },
    {
      name: "Investimentos",
      description: "Acesse renda fixa, variável, fundos e criptomoedas.",
    },
    {
      name: "Seguros",
      description: "Proteja sua família com seguros de vida e patrimônio.",
    },
    {
      name: "PIX",
      description: "Transações instantâneas sem custo adicional.",
    },
    {
      name: "Boletos",
      description: "Gere boletos para cobranças e pagamentos facilitados.",
    },
    {
      name: "Recarga de Celular",
      description: "Faça recargas direto pelo app sem taxas extras.",
    },
    {
      name: "Conta Digital",
      description: "Abra sua conta 100% digital sem taxas.",
    },
    { name: "TED e DOC", description: "Envie dinheiro para qualquer banco." },
    {
      name: "Financiamento",
      description:
        "Financiamento de imóveis e veículos com condições especiais.",
    },
    { name: "Câmbio", description: "Compra e venda de moedas estrangeiras." },
    {
      name: "Recarga de Celular",
      description: "Adicione créditos ao seu celular diretamente pelo app.",
    },
    {
      name: "Pagamentos de Contas",
      description: "Pague contas e boletos com poucos cliques.",
    },
    {
      name: "Cashback",
      description: "Ganhe dinheiro de volta em suas compras.",
    },
    {
      name: "Cartão Virtual",
      description: "Cartão seguro para compras online.",
    },
    {
      name: "Gestão Financeira",
      description: "Ferramentas para controlar seus gastos.",
    },
  ];
  res.status(200).json(products);
};

module.exports = router;
