const express = require('express');
const router = express.Router();

// Rota GET /api/financial
router.get('/', async (req, res) => {
  try {
    console.log('Buscando dados financeiros para usuário:', req.user.id);
    // Placeholder até a implementação real
    const financialData = {
      investments: 0.00,
      loans: 'Nenhum',
      consignedLoans: 'Nenhum'
    };
    res.json(financialData);
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error.message);
    res.status(500).json({ error: 'Erro ao buscar dados financeiros' });
  }
});

module.exports = router;