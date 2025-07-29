const Loan = require('../models/Loan');
const Investment = require('../models/Investment');
const VirtualCard = require('../models/VirtualCard');

exports.getFinancialData = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id });
    const investments = await Investment.find({ userId: req.user.id });
    const virtualCards = await VirtualCard.find({ userId: req.user.id });

    const financialData = {
      card: { invoice: 0 }, // Mock ou implementar
      loans: loans.map((loan) => ({
        amount: loan.amount,
        installments: loan.installments,
      })),
      consigned: [], // Mock ou implementar
      investments: {
        total: investments.reduce((sum, inv) => sum + inv.amount, 0),
      },
      virtualCards: virtualCards.map((card) => ({
        number: card.cardNumber,
        type: card.type,
        status: card.status,
      })),
    };
    res.json(financialData);
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};