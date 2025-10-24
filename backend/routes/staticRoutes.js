// backend/routes/pagesRoutes.js
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
const router = express.Router();

// Para __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, '../../frontend/pages');

router.get('/login', (req, res) => {
  res.sendFile(path.join(pagesDir, 'login.html'));
});

router.get('/pix', (req, res) => {
  res.sendFile(path.join(pagesDir, 'pix.html'));
});

router.get('/produtos', (req, res) => {
  res.sendFile(path.join(pagesDir, 'produtos.html'));
});

router.get('/servicos', (req, res) => {
  res.sendFile(path.join(pagesDir, 'servicos.html'));
});

router.get('/emprestimos', (req, res) => {
  res.sendFile(path.join(pagesDir, 'emprestimos.html'));
});

export default router;
