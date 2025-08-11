const path = require('path');
const express = require('express');
const router = express.Router();

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

module.exports = router;
