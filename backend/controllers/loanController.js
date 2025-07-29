// backend/controllers/loanController.js
const mongoose = require('mongoose');
const Loan = require('../models/Loan');

// Criar um novo empréstimo/financiamento
exports.createLoan = async (req, res) => {
  const { amount, term, type, interestRate } = req.body;

  // Validação simples
  if (!amount || !term || !type) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes',
      missing: { amount, term, type },
    });
  }

  // Validações adicionais
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valor inválido para amount', amount });
  }
  if (typeof term !== 'number' || term <= 0) {
    return res.status(400).json({ error: 'Valor inválido para term', term });
  }
  if (interestRate !== undefined && (typeof interestRate !== 'number' || interestRate < 0)) {
    return res.status(400).json({ error: 'Valor inválido para interestRate', interestRate });
  }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Tipos válidos
  const validTypes = ['personal', 'property', 'vehicle', 'consigned'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Tipo de financiamento inválido',
      type,
      validTypes,
    });
  }

  // Validação de prazos por tipo
  const validTerms = {
    personal: [12, 24, 36, 48],
    property: [120, 180, 240, 300, 360],
    vehicle: [12, 24, 36, 48, 60],
    consigned: [6, 12, 24],
  };
  if (!validTerms[type].includes(term)) {
    return res.status(400).json({
      error: 'Prazo inválido para o tipo de financiamento',
      type,
      term,
      validTerms: validTerms[type],
    });
  }

  try {
    const loan = new Loan({
      userId: new mongoose.Types.ObjectId(req.user.id),
      type,
      amount,
      term,
      interestRate: interestRate || undefined, // Usa o valor padrão do schema se não fornecido
      status: 'pending',
    });
    console.log('Tentando salvar empréstimo/financiamento:', {
      userId: req.user.id,
      type,
      amount,
      term,
      interestRate: interestRate || 'default (0.05)',
    });
    await loan.save();
    console.log('Empréstimo/financiamento salvo com sucesso:', loan);
    return res.status(201).json({ message: 'Empréstimo/financiamento solicitado com sucesso', loan });
  } catch (error) {
    console.error('Erro ao criar empréstimo/financiamento:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.status(500).json({ error: 'Erro ao salvar empréstimo/financiamento', details: error.message });
  }
};

// Financiamento de imóvel
exports.financeProperty = async (req, res) => {
  const { amount, term, type, interestRate } = req.body;

  if (!amount || !term || !type) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes',
      missing: { amount, term, type },
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valor inválido para amount', amount });
  }
  if (typeof term !== 'number' || term <= 0) {
    return res.status(400).json({ error: 'Valor inválido para term', term });
  }
  if (interestRate !== undefined && (typeof interestRate !== 'number' || interestRate < 0)) {
    return res.status(400).json({ error: 'Valor inválido para interestRate', interestRate });
  }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const validTypes = ['property'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Tipo de financiamento inválido',
      type,
      validTypes,
    });
  }

  const validTerms = [120, 180, 240, 300, 360];
  if (!validTerms.includes(term)) {
    return res.status(400).json({
      error: 'Prazo inválido para financiamento de imóvel',
      type,
      term,
      validTerms,
    });
  }

  try {
    const loan = new Loan({
      userId: new mongoose.Types.ObjectId(req.user.id),
      type,
      amount,
      term,
      interestRate: interestRate || undefined,
      status: 'pending',
    });
    console.log('Tentando salvar financiamento de imóvel:', {
      userId: req.user.id,
      type,
      amount,
      term,
      interestRate: interestRate || 'default (0.05)',
    });
    await loan.save();
    console.log('Financiamento de imóvel salvo com sucesso:', loan);
    return res.status(201).json({ message: 'Financiamento de imóvel solicitado com sucesso', loan });
  } catch (error) {
    console.error('Erro ao salvar financiamento de imóvel:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.status(500).json({ error: 'Erro ao salvar financiamento de imóvel', details: error.message });
  }
};

// Financiamento de veículo
exports.financeVehicle = async (req, res) => {
  const { amount, term, type, interestRate } = req.body;

  if (!amount || !term || !type) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes',
      missing: { amount, term, type },
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valor inválido para amount', amount });
  }
  if (typeof term !== 'number' || term <= 0) {
    return res.status(400).json({ error: 'Valor inválido para term', term });
  }
  if (interestRate !== undefined && (typeof interestRate !== 'number' || interestRate < 0)) {
    return res.status(400).json({ error: 'Valor inválido para interestRate', interestRate });
  }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const validTypes = ['vehicle'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Tipo de financiamento inválido',
      type,
      validTypes,
    });
  }

  const validTerms = [12, 24, 36, 48, 60];
  if (!validTerms.includes(term)) {
    return res.status(400).json({
      error: 'Prazo inválido para financiamento de veículo',
      type,
      term,
      validTerms,
    });
  }

  try {
    const loan = new Loan({
      userId: new mongoose.Types.ObjectId(req.user.id),
      type,
      amount,
      term,
      interestRate: interestRate || undefined,
      status: 'pending',
    });
    console.log('Tentando salvar financiamento de veículo:', {
      userId: req.user.id,
      type,
      amount,
      term,
      interestRate: interestRate || 'default (0.05)',
    });
    await loan.save();
    console.log('Financiamento de veículo salvo com sucesso:', loan);
    return res.status(201).json({ message: 'Financiamento de veículo solicitado com sucesso', loan });
  } catch (error) {
    console.error('Erro ao salvar financiamento de veículo:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.status(500).json({ error: 'Erro ao salvar financiamento de veículo', details: error.message });
  }
};

// Financiamento pessoal
exports.financePersonal = async (req, res) => {
  const { amount, term, type, interestRate } = req.body;

  if (!amount || !term || !type) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes',
      missing: { amount, term, type },
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valor inválido para amount', amount });
  }
  if (typeof term !== 'number' || term <= 0) {
    return res.status(400).json({ error: 'Valor inválido para term', term });
  }
  if (interestRate !== undefined && (typeof interestRate !== 'number' || interestRate < 0)) {
    return res.status(400).json({ error: 'Valor inválido para interestRate', interestRate });
  }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const validTypes = ['personal'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Tipo de financiamento inválido',
      type,
      validTypes,
    });
  }

  const validTerms = [12, 24, 36, 48];
  if (!validTerms.includes(term)) {
    return res.status(400).json({
      error: 'Prazo inválido para financiamento pessoal',
      type,
      term,
      validTerms,
    });
  }

  try {
    const loan = new Loan({
      userId: new mongoose.Types.ObjectId(req.user.id),
      type,
      amount,
      term,
      interestRate: interestRate || undefined,
      status: 'pending',
    });
    console.log('Tentando salvar financiamento pessoal:', {
      userId: req.user.id,
      type,
      amount,
      term,
      interestRate: interestRate || 'default (0.05)',
    });
    await loan.save();
    console.log('Financiamento pessoal salvo com sucesso:', loan);
    return res.status(201).json({ message: 'Financiamento pessoal solicitado com sucesso', loan });
  } catch (error) {
    console.error('Erro ao salvar financiamento pessoal:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.status(500).json({ error: 'Erro ao salvar financiamento pessoal', details: error.message });
  }
};

// Obter todos os empréstimos/financiamentos do usuário autenticado
exports.getUserLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: new mongoose.Types.ObjectId(req.user.id) });
    return res.json(loans);
  } catch (error) {
    console.error('Erro ao buscar empréstimos/financiamentos:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Erro no servidor', details: error.message });
  }
};

module.exports = exports;