const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('API do VascoBank rodando no Vercel 🚀');
});

module.exports = app;
