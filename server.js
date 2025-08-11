require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const cardRoutes = require('./backend/routes/cardRoutes');
const pixRoutes = require('./backend/routes/pixRoutes');
const emprestimoRoutes = require('./backend/routes/emprestimoRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const transactionRoutes = require("./backend/routes/transactionRoutes");

const app = require('./server');

const app = express();

// Middleware para verificação do Let's Encrypt
app.use('/.well-known', (req, res) => {
  res.status(204).end();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:5173'], // ajuste para produção
  credentials: true,
}));

// Helmet - segurança
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://code.jquery.com", "https://stackpath.bootstrapcdn.com"],
    styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com"],
    imgSrc: ["'self'", "data:"],
    connectSrc: [
      "'self'",
      "http://localhost:5000",
      "http://localhost:5173",
      "https://api.currencylayer.com",
      "https://api.coingecko.com",
      "https://economia.awesomeapi.com.br"
    ],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));

// Logs de requisições para API
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} Body:`, req.body);
  }
  next();
});

// Rotas da API
app.use('/api/user', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/pix', pixRoutes);
app.use('/api/emprestimos', emprestimoRoutes);
app.use('/api/transactions', transactionRoutes);

// Serve arquivos estáticos do frontend buildado (Vite)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// SPA fallback - serve index.html para qualquer rota não de API
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Rota não encontrada' });
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Conexão com MongoDB
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

// Middleware de erro geral
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err.message, err.stack);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});
// Start do servidor
//const PORT = process.env.PORT || 3000;
//app.listen(PORT, () => console.log(`Servidor Vasco_bank rodando na porta ${PORT}`))

module.exports = app;
