// backend/controllers/quoteController.js
const fetch = require('node-fetch');

console.log('🚀 Executando quoteController.js');

const getQuotes = async (req, res) => {
  console.log('🔎 getQuotes chamado em quoteController.js');
   console.log('[quoteController.js] getQuotes chamado para user:', req.user?.id);
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const exchangeRateApiKey = process.env.EXCHANGERATE_API_KEY;
    if (!exchangeRateApiKey) {
      console.error('❌ Erro: EXCHANGERATE_API_KEY não configurada');
      return res.status(500).json({ error: 'Chave de API não configurada' });
    }

    const [fiatResponse, cryptoResponse] = await Promise.all([
      fetch(`https://v6.exchangerate-api.com/v6/${exchangeRateApiKey}/latest/USD`),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl')
    ]);

    if (!fiatResponse.ok) throw new Error(`Erro na ExchangeRate-API: ${fiatResponse.status}`);
    if (!cryptoResponse.ok) throw new Error(`Erro na CoinGecko: ${cryptoResponse.status}`);

    const fiatData = await fiatResponse.json();
    console.log('💱 fiatData:', JSON.stringify(fiatData, null, 2));
    const cryptoData = await cryptoResponse.json();
    console.log('🪙 cryptoData:', JSON.stringify(cryptoData, null, 2));

    if (!fiatData.conversion_rates || !cryptoData.bitcoin) {
      throw new Error('Formato de dados inválido');
    }

    // Acessar os valores como número para usar toFixed
    const brlRate = Number(fiatData.conversion_rates.BRL);
    const eurRate = Number(fiatData.conversion_rates.EUR);
    const gbpRate = Number(fiatData.conversion_rates.GBP);
    const jpyRate = Number(fiatData.conversion_rates.JPY);
    const chfRate = Number(fiatData.conversion_rates.CHF);
    const btcBrl = Number(cryptoData.bitcoin.brl);

    const mockStockQuotes = {
      'IBOVESPA': { rate: '125000', updated: new Date().toISOString() },
      'SP500': { rate: '5000', updated: new Date().toISOString() },
      'NASDAQ': { rate: '16000', updated: new Date().toISOString() },
      'PETR4': { rate: '40.50', updated: new Date().toISOString() },
      'AAPL': { rate: '190.00', updated: new Date().toISOString() }
    };

    const quotes = {
      quotes: {
        'USD': { rate: brlRate.toFixed(2), updated: new Date().toISOString() },
        'EUR': { rate: (brlRate / eurRate).toFixed(2), updated: new Date().toISOString() },
        'GBP': { rate: (brlRate / gbpRate).toFixed(2), updated: new Date().toISOString() },
        'JPY': { rate: (brlRate / jpyRate).toFixed(3), updated: new Date().toISOString() },
        'CHF': { rate: (brlRate / chfRate).toFixed(2), updated: new Date().toISOString() },
        'BTC/BRL': { rate: btcBrl.toFixed(0), updated: new Date().toISOString() },
        ...mockStockQuotes
      },
      userId,
      accountNumber: req.user.accountNumber
    };

    console.log('✅ quotes geradas:', quotes);

    res.json(quotes);
  } catch (error) {
    console.error(`❌ Erro ao buscar cotações para userId ${req.user?.id}:`, error.message);
    res.status(500).json({ error: `Erro ao buscar cotações: ${error.message}` });
  }
};

module.exports = { getQuotes };
