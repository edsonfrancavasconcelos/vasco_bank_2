const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');

const transfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { accountNumber, amount } = req.body;
    if (!accountNumber?.trim() || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Número da conta e valor são obrigatórios' });
    }
    if (!/^ACC\d{6}$/.test(accountNumber)) {
      return res.status(400).json({ error: 'Número da conta inválido' });
    }

    const dailyLimit = 5000;
    const today = new Date().setHours(0, 0, 0, 0);
    const dailyTransactions = await Transaction.find({
      userId: req.user.id,
      type: 'transfer',
      date: { $gte: today },
    });
    const dailyTotal = dailyTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (dailyTotal + amount > dailyLimit) {
      return res.status(400).json({ error: 'Limite diário excedido' });
    }

    const user = await User.findById(req.user.id).session(session);
    if (!user || user.balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const recipient = await User.findOne({ accountNumber }).session(session);
    if (!recipient) {
      return res.status(404).json({ error: 'Conta destino não encontrada' });
    }

    user.balance -= amount;
    recipient.balance += amount;

    const transaction = new Transaction({
      userId: req.user.id,
      type: 'transfer',
      amount,
      details: { accountNumber },
    });

    await Promise.all([
      user.save({ session }),
      recipient.save({ session }),
      transaction.save({ session }),
    ]);

    await session.commitTransaction();
    res.json({ message: 'Transferência realizada com sucesso' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Erro ao transferir:', error.stack);
    res.status(500).json({ error: `Erro ao realizar transferência: ${error.message}` });
  } finally {
    session.endSession();
  }
};

const deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const user = await User.findById(req.user.id);
    user.balance += amount;

    const transaction = new Transaction({
      userId: req.user.id,
      type: 'deposit',
      amount,
      details: {},
    });

    await Promise.all([user.save(), transaction.save()]);
    res.json({ message: 'Depósito realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao depositar:', error.stack);
    res.status(500).json({ error: `Erro ao realizar depósito: ${error.message}` });
  }
};

const withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const user = await User.findById(req.user.id);
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    user.balance -= amount;

    const transaction = new Transaction({
      userId: req.user.id,
      type: 'withdraw',
      amount,
      details: {},
    });

    await Promise.all([user.save(), transaction.save()]);
    res.json({ message: 'Saque realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao sacar:', error.stack);
    res.status(500).json({ error: `Erro ao realizar saque: ${error.message}` });
  }
};

const payBill = async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode) {
      return res.status(400).json({ error: 'Código de barras obrigatório' });
    }

    const amount = 100;
    const user = await User.findById(req.user.id);
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    user.balance -= amount;

    const transaction = new Transaction({
      userId: req.user.id,
      type: 'bill',
      amount,
      details: { barcode },
    });

    await Promise.all([user.save(), transaction.save()]);
    res.json({ message: 'Boleto pago com sucesso' });
  } catch (error) {
    console.error('Erro ao pagar boleto:', error.stack);
    res.status(500).json({ error: `Erro ao pagar boleto: ${error.message}` });
  }
};
const rechargePhone = async (req, res) => {
  try {
    const { operator, amount, phone } = req.body;
    const userId = req.user.id;

    // Verificações mínimas
    if (!phone) {
      return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }

    if (!operator) {
      return res.status(400).json({ error: 'Operadora é obrigatória.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valor da recarga inválido.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (user.balance < parsedAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente para recarga.' });
    }

    user.balance -= parsedAmount;

    const transaction = new Transaction({
      userId,
      type: 'recharge',
      amount: parsedAmount,
      details: { operator, phone },
    });

    await Promise.all([user.save(), transaction.save()]);

    res.json({ message: 'Recarga realizada com sucesso', transaction });
  } catch (error) {
    console.error('Erro ao processar recarga:', error);
    res.status(500).json({ error: 'Erro ao processar recarga' });
  }
};
const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ transactions });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error.stack);
    res.status(500).json({ error: `Erro ao buscar histórico: ${error.message}` });
  }
};

const getFinancialData = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id });
    const cardInvoice = 0;
    const consigned = [];
    res.json({ card: { invoice: cardInvoice }, loans, consigned });
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error.stack);
    res.status(500).json({ error: `Erro ao buscar dados financeiros: ${error.message}` });
  }
};

module.exports = {
  transfer,
  deposit,
  withdraw,
  payBill,
  rechargePhone,
  getTransactionHistory,
  getFinancialData,
};
