// backend/controllers/transactionController.js

const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(txs);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar transações' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const tx = new Transaction({ ...req.body, user: req.user.id });
    await tx.save();
    res.status(201).json(tx);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar transação' });
  }
};
