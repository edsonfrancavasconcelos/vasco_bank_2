// backend/routes/emailRoutes.js

const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService'); // ajuste o caminho conforme sua estrutura

// Rota POST para enviar email
router.post('/enviar-email', async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Campos to, subject e message são obrigatórios' });
  }

  try {
    await sendEmail(to, subject, message);
    res.json({ message: 'Email enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar email na rota:', error);
    res.status(500).json({ error: 'Falha ao enviar email' });
  }
});

module.exports = router;
