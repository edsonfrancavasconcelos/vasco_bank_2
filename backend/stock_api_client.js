
const axios = require('axios');

// URL base da API de cotação
const API_BASE_URL = 'http://5000-ikvww1szhs92uop52zp9e-67675091.manus.computer';

/**
 * Obtém a cotação atual de uma ação específica
 * @param {string} symbol - Símbolo da ação (ex: AAPL, PETR4.SA)
 * @param {string} region - Região da ação (US, BR, EU, ASIA)
 * @returns {Promise<Object>} - Dados da cotação
 */
async function getQuote(symbol, region = 'US') {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/quote/${symbol}`, {
      params: { region },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao obter cotação para ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Obtém o resumo do mercado (principais índices)
 * @param {string} region - Região (US, BR, EU, ASIA, all)
 * @returns {Promise<Object>} - Dados do resumo de mercado
 */
async function getMarketSummary(region = 'all') {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/market/summary`, {
      params: { region },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao obter resumo de mercado:`, error.message);
    throw error;
  }
}

/**
 * Lista todas as ações importantes disponíveis
 * @param {string} region - Região (US, BR, EU, ASIA, all)
 * @returns {Promise<Object>} - Lista de ações e índices
 */
async function listStocks(region = 'all') {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/stocks/list`, {
      params: { region },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao listar ações:`, error.message);
    throw error;
  }
}

/**
 * Obtém cotações de múltiplas ações e formata no padrão esperado pelo servidor
 * @param {Array<string>} symbols - Lista de símbolos de ações
 * @returns {Promise<Object>} - Objeto com cotações formatadas
 */
async function getMultipleQuotes(symbols = [
  'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 
  'AAPL', 'MSFT', 'GOOGL', 'AMZN',
  '^BVSP', '^GSPC', '^IXIC'
]) {
  try {
    const quotes = {};
    const now = new Date().toISOString();
    
    // Obter resumo do mercado para os índices
    const marketSummary = await getMarketSummary();
    
    if (marketSummary && marketSummary.market_summary) {
      // Processar índices do resumo de mercado
      for (const index of marketSummary.market_summary) {
        if (symbols.includes(index.symbol)) {
          quotes[index.symbol === '^BVSP' ? 'IBOVESPA' : 
                 index.symbol === '^GSPC' ? 'SP500' : 
                 index.symbol === '^IXIC' ? 'NASDAQ' : 
                 index.symbol] = {
            rate: index.last_price.toString(),
            updated: index.timestamp || now
          };
        }
      }
    }
    
    // Obter cotações individuais para ações
    const stockSymbols = symbols.filter(s => !s.startsWith('^'));
    
    // Processar em lotes para não sobrecarregar a API
    const batchSize = 5;
    for (let i = 0; i < stockSymbols.length; i += batchSize) {
      const batch = stockSymbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => {
        const region = symbol.includes('.SA') ? 'BR' : 'US';
        return getQuote(symbol, region);
      });
      
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          const symbol = batch[index];
          quotes[symbol.replace('.SA', '')] = {
            rate: data.last_price.toString(),
            updated: data.timestamp || now
          };
        }
      });
    }
    
    return quotes;
  } catch (error) {
    console.error('Erro ao obter múltiplas cotações:', error.message);
    throw error;
  }
}

/**
 * Obtém todas as cotações necessárias para o formato esperado pelo servidor
 * Inclui moedas, criptomoedas e ações
 * @returns {Promise<Object>} - Objeto com todas as cotações formatadas
 */
async function getAllQuotes() {
  try {
    // Obter cotações de ações da nossa API
    const stockQuotes = await getMultipleQuotes();
    
    // Para moedas e criptomoedas, manter a implementação original
    // Estas requisições seriam feitas no servidor principal
    
    return {
      quotes: {
        ...stockQuotes
        // As cotações de moedas e criptomoedas serão adicionadas pelo servidor principal
      }
    };
  } catch (error) {
    console.error('Erro ao obter todas as cotações:', error.message);
    
    // Retornar dados mockados como fallback apenas para ações
    const fallbackStockQuotes = {
      'IBOVESPA': { rate: '125000', updated: new Date().toISOString() },
      'SP500': { rate: '5000', updated: new Date().toISOString() },
      'NASDAQ': { rate: '16000', updated: new Date().toISOString() },
      'PETR4': { rate: '40.50', updated: new Date().toISOString() },
      'AAPL': { rate: '190.00', updated: new Date().toISOString() }
    };
    
    return {
      quotes: fallbackStockQuotes
    };
  }
}

module.exports = {
  getQuote,
  getMarketSummary,
  listStocks,
  getMultipleQuotes,
  getAllQuotes
};
