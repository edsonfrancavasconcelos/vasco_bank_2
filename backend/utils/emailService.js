require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia um email com HTML opcional.
 * @param {string} to - Destinatário.
 * @param {string} subject - Assunto do email.
 * @param {string} html - Conteúdo HTML do email.
 * @returns {Promise<object>} - Info do envio.
 */
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

module.exports = { sendEmail };
