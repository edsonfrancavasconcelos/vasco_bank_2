// ./controllers/pixController.js
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const PixKey = require('../models/PixKey');
const Transaction = require('../models/Transaction');

const getPixKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const keys = await PixKey.find({ userId }).select('_id type value createdAt');
    res.json({ keys });
  } catch (error) {
    console.error(`Erro ao buscar chaves Pix para userId ${req.user?.id}:`, error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const deletePixKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.id;
    const pixKey = await PixKey.findOne({ _id: keyId, userId });
    if (!pixKey) {
      return res.status(404).json({ error: 'Chave Pix não encontrada ou não pertence ao usuário' });
    }
    await PixKey.deleteOne({ _id: keyId, userId });
    res.json({ message: 'Chave Pix excluída com sucesso' });
  } catch (error) {
    console.error(`Erro ao excluir chave Pix ${req.params.id} para userId ${req.user?.id}:`, error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const transferPix = async (req, res) => {
  const { pixKey, amount } = req.body;
  const fromAccount = req.user.accountNumber;

  if (!pixKey || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Chave PIX e valor válido são obrigatórios' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const sender = await User.findOne({ accountNumber: fromAccount }).session(session);
    const pix = await PixKey.findOne({ value: pixKey }).session(session);
    if (!sender || !pix) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Conta ou chave PIX não encontrada' });
    }
    const receiver = await User.findById(pix.userId).session(session);
    if (!receiver) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Destinatário não encontrado' });
    }
    if (sender.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    sender.balance -= amount;
    receiver.balance += amount;
    await sender.save({ session });
    await receiver.save({ session });
    const transaction = new Transaction({
      type: 'pix/transfer',
      amount,
      fromAccount,
      targetAccount: receiver.accountNumber,
      description: 'PIX Transferência',
      userId: req.user.id,
      date: new Date(),
    });
    await transaction.save({ session });
    await session.commitTransaction();
    res.json({ message: 'PIX Transferência realizada com sucesso', balance: sender.balance });
  } catch (error) {
    await session.abortTransaction();
    console.error('Erro na PIX transferência:', error.message);
    res.status(500).json({ error: 'Erro ao processar PIX transferência' });
  } finally {
    session.endSession();
  }
};

const payPix = async (req, res) => {
  const { pixKey, amount } = req.body;
  const fromAccount = req.user.accountNumber;

  if (!pixKey || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Chave PIX e valor válido são obrigatórios' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const sender = await User.findOne({ accountNumber: fromAccount }).session(session);
    if (!sender) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    if (sender.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    sender.balance -= amount;
    await sender.save({ session });
    const transaction = new Transaction({
      type: 'pix/pay',
      amount,
      fromAccount,
      targetAccount: pixKey,
      description: 'Pagamento PIX',
      userId: req.user.id,
      date: new Date(),
    });
    await transaction.save({ session });
    await session.commitTransaction();
    res.json({ message: 'Pagamento PIX realizado com sucesso', balance: sender.balance });
  } catch (error) {
    await session.abortTransaction();
    console.error('Erro no pagamento PIX:', error.message);
    res.status(500).json({ error: 'Erro ao processar pagamento PIX' });
  } finally {
    session.endSession();
  }
};

const chargePix = async (req, res) => {
  const { amount, description } = req.body;
  const fromAccount = req.user.accountNumber;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valor válido é obrigatório' });
  }

  try {
    const transaction = new Transaction({
      type: 'pix/charge',
      amount,
      fromAccount,
      targetAccount: 'N/A',
      description: description || 'Cobrança PIX',
      userId: req.user.id,
      date: new Date(),
    });
    await transaction.save();
    res.json({ message: 'Cobrança PIX criada com sucesso', transaction });
  } catch (error) {
    console.error('Erro na cobrança PIX:', error.message);
    res.status(500).json({ error: 'Erro ao criar cobrança PIX' });
  }
};

const schedulePix = async (req, res) => {
  const { pixKey, amount, date } = req.body;
  const fromAccount = req.user.accountNumber;

  if (!pixKey || !amount || amount <= 0 || !date) {
    return res.status(400).json({ error: 'Chave PIX, valor e data são obrigatórios' });
  }

  try {
    const transaction = new Transaction({
      type: 'pix/schedule',
      amount,
      fromAccount,
      targetAccount: pixKey,
      description: 'Agendamento PIX',
      userId: req.user.id,
      date: new Date(date),
    });
    await transaction.save();
    res.json({ message: 'PIX agendado com sucesso', transaction });
  } catch (error) {
    console.error('Erro no agendamento PIX:', error.message);
    res.status(500).json({ error: 'Erro ao agendar PIX' });
  }
};

const registerPixKey = async (req, res) => {
  const { type, value } = req.body;
  const userId = req.user.id;

  if (!['cpf', 'email', 'phone', 'random'].includes(type) || !value) {
    return res.status(400).json({ error: 'Tipo ou valor da chave inválido' });
  }

  try {
    const existingKey = await PixKey.findOne({ value });
    if (existingKey) {
      return res.status(400).json({ error: 'Chave PIX já registrada' });
    }
    const pixKey = new PixKey({ userId, type, value });
    await pixKey.save();
    res.json({ message: 'Chave PIX registrada com sucesso', pixKey });
  } catch (error) {
    console.error('Erro ao registrar chave PIX:', error.message);
    res.status(500).json({ error: 'Erro ao registrar chave PIX' });
  }
};

module.exports = {
  transferPix,
  payPix,
  chargePix,
  schedulePix,
  registerPixKey,
  getPixKeys,
  deletePixKey,
};