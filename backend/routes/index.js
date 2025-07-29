// Importação das rotas
const cardRoutes = require('./cardRoutes');
const investmentRoutes = require('./investmentRoutes');
const loginRoutes = require('./loginRoutes');
const loanRoutes = require('./loanRoutes');
const pixRoutes = require('./pixRoutes');
const productRoutes = require('./productRoutes');
const quoteRoutes = require('./quoteRoutes');
const recoverRoutes = require('./recoverRoutes');
const statementRoutes = require('./statementRoutes');
const transactionRoutes = require('./transactionRoutes');
const userRoutes = require('./userRoutes');
const virtualCardRoutes = require('./virtualCardRoutes');

// Exportação das rotas em ordem alfabética
module.exports = {
  cardRoutes,
  investmentRoutes,
  loginRoutes,
  loanRoutes,
  pixRoutes,
  productRoutes,
  quoteRoutes,
  recoverRoutes,
  statementRoutes,
  transactionRoutes,
  userRoutes,
  virtualCardRoutes
};