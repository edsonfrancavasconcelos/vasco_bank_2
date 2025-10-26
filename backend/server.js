// backend/server.js
console.log('[DEBUG] JWT_SECRET do servidor:', process.env.JWT_SECRET);
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

// ================================
// 🔹 MODELOS
// ================================
import './models/Usuario.js';
import './models/PixUsuario.js';
import './models/Transaction.js';
import './models/Card.js';
import './models/Emprestimo.js';
import './models/PedidoCartao.js';
import './models/Fatura.js'; // ✅ Novo modelo de faturas


// ================================
// 🔹 ROTAS
// ================================
import cardRoutes from './routes/cardRoutes.js';
import emprestimoRoutes from './routes/emprestimoRoutes.js';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import pixRoutes from './routes/pixRoutes.js';
import historicoRoutes from './routes/historicoRoutes.js';
import faturaRoutes from './routes/faturaRoutes.js';

// ================================
// 🔹 UTILITÁRIOS
// ================================
import { atualizarStatusFaturas } from './utils/faturaScheduler.js'; // ✅ Novo agendador automático

// ================================
// 🔹 CONFIGURAÇÃO DO SERVIDOR
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vasco_bank';

console.log('🔹 MONGO_URI:', process.env.MONGO_URI ? 'OK' : '❌ Não definido');
console.log('🔹 JWT_SECRET:', process.env.JWT_SECRET ? 'OK' : '❌ Não definido');
console.log('Mongo URI:', mongoURI.replace(/:([^:@]+)@/, ':****@'));

// ================================
// 🔹 LETS ENCRYPT
// ================================
app.use('/.well-known', (req, res) => res.sendStatus(204));

// ================================
// 🔹 BODY PARSERS
// ================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================================
// 🔹 FRONTEND STATIC FILES
// ================================
app.use(
  express.static(path.join(__dirname, '../frontend/pages'), {
    maxAge: 0,
    etag: false,
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    },
  })
);
app.use(express.static(path.join(process.cwd(), "public")));

app.use(
  '/image',
  express.static(path.join(__dirname, '../frontend/pages/img'), {
    maxAge: 0,
    etag: false,
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    },
  })
);

// ================================
// 🔹 CSS E JS MANUAIS
// ================================
app.use('/theme.css', (req, res) => {
  const cssPath = path.join(__dirname, '../frontend/pages/css/theme.css');
  if (!fs.existsSync(cssPath)) {
    console.error(`❌ Arquivo CSS não encontrado: ${cssPath}`);
    return res.status(404).send('CSS não encontrado');
  }
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  fs.createReadStream(cssPath).pipe(res);
});

app.use('/js/login.js', (req, res) => {
  const jsPath = path.join(__dirname, '../frontend/pages/js/login.js');
  if (!fs.existsSync(jsPath)) {
    console.error(`❌ Arquivo login.js não encontrado: ${jsPath}`);
    return res.status(404).send('Arquivo login.js não encontrado');
  }
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  fs.createReadStream(jsPath).pipe(res);
});

// ================================
// 🔹 CORS E SEGURANÇA
// ================================
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })
);

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://code.jquery.com',
        'https://stackpath.bootstrapcdn.com',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://stackpath.bootstrapcdn.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: [
        "'self'",
        'http://localhost:3000',
        'http://localhost:5173',
        'https://api.currencylayer.com',
        'https://api.coingecko.com',
        'https://economia.awesomeapi.com.br',
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// ================================
// 🔹 LOGGING
// ================================
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} Body:`, req.body);
  }
  next();
});

// ================================
// 🔹 VERIFICAR CONEXÃO DB
// ================================
app.use((req, res, next) => {
  if (req.url.startsWith('/api/') && mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Banco de dados indisponível. Tente novamente mais tarde.' });
  }
  next();
});

// ================================
// 🔹 ROTAS API
// ================================
app.use('/api/user', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/emprestimos', emprestimoRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/pix', pixRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/fatura', faturaRoutes);




// ================================
// 🔹 404 E ERROS GLOBAIS
// ================================
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) return res.status(404).json({ error: 'Rota não encontrada' });
  next();
});

app.use((err, req, res, next) => {
  console.error('🔥 Erro no servidor:', err.message);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

// ================================
// 🔹 CONEXÃO MONGO + SCHEDULER
// ================================
const startServer = async () => {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });

    console.log('✅ Conectado com sucesso ao VBank-MongoDB!');
   //(PORT, () => console.log(`🚀 Servidor VBank porta ${PORT}`));
   if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor VBank porta ${PORT}`);
  });
}

    // ⚙️ Atualiza status das faturas automaticamente a cada 24h
    setInterval(atualizarStatusFaturas, 24 * 60 * 60 * 1000);
    atualizarStatusFaturas(); // Executa ao iniciar

  } catch (err) {
    console.error('❌ Erro ao conectar ao VBank-MongoDB:', err.message);
    console.log('⏳ Tentando reconectar em 5 segundos...');
    setTimeout(startServer, 5000);
  }
};

mongoose.connection.on('disconnected', () =>
  console.log('⚠️ VBank-MongoDB desconectado, tentando reconectar...')
);
mongoose.connection.on('reconnected', () =>
  console.log('✅ VBank-MongoDB reconectado com sucesso!')
);

// ================================
// 🚀 INICIAR SERVIDOR
// ================================
startServer();
