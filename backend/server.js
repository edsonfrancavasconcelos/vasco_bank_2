const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
require('dotenv').config();

// Importa middlewares e rotas
const auth = require('./middleware/auth.js');
const resetRoutes = require('./routes/resetRoutes');
const userRoutes = require('./routes/userRoutes.js');
const transactionRoutes = require('./routes/transactionRoutes.js');
const loginRoutes = require('./routes/loginRoutes.js');
const cardRoutes = require('./routes/cardRoutes.js');
const pixRoutes = require('./routes/pixRoutes.js');
const loanRoutes = require('./routes/loanRoutes.js');
const investmentRoutes = require('./routes/investmentRoutes.js');
const virtualCardRoutes = require('./routes/virtualCardRoutes.js');
const financialRoutes = require('./routes/financialRoutes.js');
const quotesRouter = require('./routes/quotes');
const emailRoutes = require('./routes/emailRoutes');
const { getTransactionHistory } = require('./controllers/transactionController.js');

// Carregamento dinâmico dos modelos
const models = [
  './models/User',
  './models/Transaction',
  './models/Card',
  './models/PixKey',
  './models/Loan',
  './models/Investment',
  './models/VirtualCard',
];

models.forEach(modelPath => {
  try {
    const fullPath = path.join(__dirname, `${modelPath}.js`);
    if (fs.existsSync(fullPath)) {
      require(modelPath);
      console.log(`Modelo ${modelPath} carregado com sucesso`);
    } else {
      console.warn(`Modelo ${modelPath} não encontrado, pulando...`);
    }
  } catch (error) {
    console.error(`Erro ao carregar modelo ${modelPath}:`, error.message);
  }
});

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/pages')));
app.use('/image', express.static(path.join(__dirname, '../frontend/pages/img')));
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:5173'],
  credentials: true,
}));

// Logger simples para requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helmet com CSP configurado
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://code.jquery.com", "https://stackpath.bootstrapcdn.com"],
    styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com"],
    imgSrc: ["'self'", "data:"],
    connectSrc: [
      "'self'",
      "http://localhost:5000",
      "https://api.currencylayer.com",
      "https://api.coingecko.com",
      "https://economia.awesomeapi.com.br"
    ],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));

// Conexão MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vasco_bank';
console.log('Mongo URI:', mongoURI.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
})
  .then(() => console.log('Conectado ao MongoDB Atlas com sucesso!'))
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB Atlas:', err);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB desconectado, tentando reconectar...');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconectado com sucesso!');
});

// Rotas API — removi duplicações e ordens conflitantes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', userRoutes);  // rota /api/users/me deve estar aqui no próprio userRoutes
app.use('/api/users/reset-password', resetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/cards', auth, cardRoutes);
app.use('/api/pix', auth, pixRoutes);
app.use('/api/investments', auth, investmentRoutes);
app.use('/api/loans', auth, loanRoutes);
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/virtualCards', virtualCardRoutes); // Sem auth, como você escolheu
app.use('/api/financial', auth, financialRoutes);
app.get('/api/transactions/history', auth, getTransactionHistory);
app.use('/api/quotes', quotesRouter);
app.use('/api', emailRoutes);

// Middleware para rotas API não encontradas
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log('Rota API não encontrada:', req.method, req.url);
    return res.status(404).json({ error: 'Rota não encontrada' });
  }
  next();
});

// Middleware geral para erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err.message, err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicia servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor Vasco_bank rodando na porta ${PORT}`));
