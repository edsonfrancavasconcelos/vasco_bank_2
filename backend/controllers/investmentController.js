// backend/controllers/investmentController.js

const Investment = require('../models/Investment');

exports.getInvestments = async (req, res) => {
  try {
    const list = await Investment.find({ user: req.user.id });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar investimentos' });
  }
};
