const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => { // <-- só barra raiz aqui!
  try {
    // Câmbio BRL/USD
    const brlUsd = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    // Bitcoin em BRL
    const btcBrl = await axios.get('https://economia.awesomeapi.com.br/json/last/BTC-BRL');

    if (!brlUsd.data || !btcBrl.data) {
      throw new Error('Dados inválidos da API');
    }

    const usdBrlRate = parseFloat(brlUsd.data['USDBRL'].bid);
    const btcBrlRate = parseFloat(btcBrl.data['BTCBRL'].bid);

    const mockStockQuotes = {
      'IBOVESPA': { rate: '125000', updated: new Date().toISOString() },
      'SP500': { rate: '5000', updated: new Date().toISOString() },
      'NASDAQ': { rate: '16000', updated: new Date().toISOString() },
      'PETR4': { rate: '40.50', updated: new Date().toISOString() },
      'AAPL': { rate: '190.00', updated: new Date().toISOString() }
    };

    const quotes = {
      quotes: {
        'USD/BRL': { rate: usdBrlRate.toFixed(4), updated: new Date().toISOString() },
        'BTC/BRL': { rate: btcBrlRate.toFixed(0), updated: new Date().toISOString() },
        ...mockStockQuotes
      },
      userId: req.user.id,
      accountNumber: req.user.accountNumber
    };

    res.json(quotes);

  } catch (error) {
    console.error('Erro ao buscar cotações:', error.message);
    res.status(500).json({ error: `Erro ao buscar cotações: ${error.message}` });
  }
});

module.exports = router;
