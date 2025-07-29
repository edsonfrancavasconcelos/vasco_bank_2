const router = require('express').Router();
const {
  transfer,
  deposit,
  withdraw,
  payBill,
  rechargePhone, // Corrigido para o nome da função correta
  getTransactionHistory,
  getFinancialData,
} = require('../controllers/transactionController');
const auth = require('../middleware/auth');

router.post('/transfer', auth, transfer);
router.post('/deposit', auth, deposit);
router.post('/withdraw', auth, withdraw);
router.post('/payBill', auth, payBill);
router.post('/recharge', auth, rechargePhone); // Corrigido aqui também
router.get('/history', auth, getTransactionHistory);
router.get('/financial', auth, getFinancialData);

router.get('/statement/:accountNumber', auth, async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const user = await require('../models/User').findOne({ accountNumber });
    if (!user) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    const transactions = await require('../models/Transaction').find({ userId: user._id }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Erro ao buscar extrato:', error.message);
    res.status(500).json({ error: 'Erro ao buscar extrato.' });
  }
});

module.exports = router;
