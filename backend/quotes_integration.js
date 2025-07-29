// backend/quotesIntegration.js
const fetch = require('node-fetch');

const fetchAlphaVantageQuote = async (symbol, apiKey) => {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro na Alpha Vantage para ${symbol}: ${response.status}`);
  const data = await response.json();
  const quote = data["Global Quote"];
  if (!quote || !quote["05. price"]) throw new Error(`Dados inválidos da Alpha Vantage para ${symbol}`);
  return {
    rate: Number(quote["05. price"]).toFixed(2),
    updated: new Date().toISOString()
  };
};

const getQuotes = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });

    const exchangeRateApiKey = process.env.EXCHANGERATE_API_KEY;
    const alphaVantageApiKey = process.env.ALPHAVANTAGE_API_KEY;
    if (!exchangeRateApiKey || !alphaVantageApiKey) {
      return res.status(500).json({ error: 'Chaves de API não configuradas' });
    }

    const [fiatResponse, cryptoResponse] = await Promise.all([
      fetch(`https://v6.exchangerate-api.com/v6/${exchangeRateApiKey}/latest/USD`),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl')
    ]);

    if (!fiatResponse.ok) throw new Error(`Erro na ExchangeRate-API: ${fiatResponse.status}`);
    if (!cryptoResponse.ok) throw new Error(`Erro na CoinGecko: ${cryptoResponse.status}`);

    const fiatData = await fiatResponse.json();
    const cryptoData = await cryptoResponse.json();

    const BRL     = Number(fiatData.conversion_rates.BRL);
    const EUR     = Number(fiatData.conversion_rates.EUR);
    const GBP     = Number(fiatData.conversion_rates.GBP);
    const JPY     = Number(fiatData.conversion_rates.JPY);
    const CHF     = Number(fiatData.conversion_rates.CHF);
    const BTC_BRL = Number(cryptoData.bitcoin.brl);
    const now     = new Date().toISOString();

    // Consulta à Alpha Vantage (ações reais)
    const symbols = ['PETR4.SA', 'VALE3.SA', 'AAPL', 'MSFT', 'ITUB4.SA'];
    const stockQuotes = {};

    for (const symbol of symbols) {
      try {
        stockQuotes[symbol] = await fetchAlphaVantageQuote(symbol, alphaVantageApiKey);
      } catch (err) {
        console.warn(`Erro ao buscar ${symbol}: ${err.message}`);
      }
    }

    const quotes = {
      quotes: {
        'USD/BRL': { rate: BRL.toFixed(2),         updated: now },
        'EUR/BRL': { rate: (BRL / EUR).toFixed(2), updated: now },
        'GBP/BRL': { rate: (BRL / GBP).toFixed(2), updated: now },
        'JPY/BRL': { rate: (BRL / JPY).toFixed(3), updated: now },
        'CHF/BRL': { rate: (BRL / CHF).toFixed(2), updated: now },
        'BTC/BRL': { rate: BTC_BRL.toFixed(0),     updated: now },
        ...stockQuotes
      },
      userId,
      accountNumber: req.user.accountNumber
    };

    return res.json(quotes);

  } catch (error) {
    console.error(`Erro ao buscar cotações para userId ${req.user?.id}:`, error.message);
    return res.status(500).json({ error: `Erro ao buscar cotações: ${error.message}` });
  }
};

module.exports = { getQuotes };
