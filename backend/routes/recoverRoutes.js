const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

router.post(
  '/',
  [
    body('email').isEmail().withMessage('E-mail inválido'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      // Configuração do transporte de e-mail (ajuste com suas credenciais)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Link de recuperação fictício (substituir por lógica real)
      const resetLink = `http://localhost:5000/reset-password?email=${email}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Recuperação de Senha',
        text: `Clique no link para redefinir sua senha: ${resetLink}`,
      });

      res.status(200).json({ message: 'Instruções de recuperação enviadas para o e-mail.' });
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error.message);
      res.status(500).json({ error: 'Erro ao processar solicitação de recuperação.' });
    }
  }
);

module.exports = router;