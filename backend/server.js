
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');

console.log('🔹 MONGO_URI:', process.env.MONGO_URI ? 'OK' : '❌ Não definido');
console.log('🔹 JWT_SECRET:', process.env.JWT_SECRET ? 'OK' : '❌ Não definido');

const cardRoutes = require('./routes/cardRoutes');
const pixRoutes = require('./routes/pixRoutes');
const emprestimoRoutes = require('./routes/emprestimoRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// Resposta para verificação do Let's Encrypt
app.use('/.well-known', (req, res) => res.sendStatus(204));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/pages')));

// Servir imagens
app.use('/image', express.static(path.join(__dirname, '../frontend/pages/img')));

// Servir CSS manualmente
app.use('/theme.css', (req, res) => {
  const cssPath = path.join(__dirname, '../frontend/pages/css/theme.css');
  if (!fs.existsSync(cssPath)) {
    console.error(`❌ Arquivo CSS não encontrado: ${cssPath}`);
    return res.status(404).send('CSS não encontrado');
  }
  res.setHeader('Content-Type', 'text/css');
  fs.createReadStream(cssPath).pipe(res);
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://code.jquery.com", "https://stackpath.bootstrapcdn.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://stackpath.bootstrapcdn.com"],
    imgSrc: ["'self'", "data:"],
    connectSrc: [
      "'self'",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://api.currencylayer.com",
      "https://api.coingecko.com",
      "https://economia.awesomeapi.com.br",
    ],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));

app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} Body:`, req.body);
  }
  next();
});

app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Banco de dados indisponível. Tente novamente mais tarde.' });
    }
  }
  next();
});

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vasco_bank';
console.log('Mongo URI:', mongoURI.replace(/:([^:@]+)@/, ':****@'));

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });
    console.log('✅ Conectado ao MongoDB com sucesso!');
    app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    console.log('⏳ Tentando reconectar em 5 segundos...');
    setTimeout(startServer, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB desconectado, tentando reconectar...');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconectado com sucesso!');
});

app.use('/api/user', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/pix', pixRoutes);
app.use('/api/emprestimos', emprestimoRoutes);
app.use('/api/transactions', transactionRoutes);


app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log('❌ Rota API não encontrada:', req.method, req.url);
    return res.status(404).json({ error: 'Rota não encontrada' });
  }
  next();
});

app.use((err, req, res, next) => {
  console.error('🔥 Erro no servidor:', err.message);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

startServer();
