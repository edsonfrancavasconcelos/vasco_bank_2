// C:\Users\edson\OneDrive\Documents\Meus_Projetos\Vasco_bank_2\backend\controllers\investmentController.js
const mongoose = require('mongoose');
const Investment = require('../models/Investment');

// Criar um novo investimento
exports.createInvestment = async (req, res) => {
  const { userId, type, amount, returnRate } = req.body;

  // Validação simples
  if (!userId || !type || !amount || !returnRate) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes',
      missing: { userId, type, amount, returnRate },
    });
  }

  // Validações adicionais
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valor inválido para amount', amount });
  }
  if (typeof returnRate !== 'number' || returnRate < 0) {
    return res.status(400).json({ error: 'Valor inválido para returnRate', returnRate });
  }
  if (!req.user || !req.user.id || req.user.id !== userId) {
    return res.status(401).json({
      error: 'Usuário não autenticado ou userId inválido',
      userId,
      authUser: req.user?.id,
    });
  }

  // Lista de tipos válidos do enum
  const validTypes = ['fixed_income', 'stocks', 'funds', 'crypto'];

  // Mapeamento de tipos do frontend para o backend
  const typeMap = {
    CDB: 'fixed_income',
    TESOURO: 'fixed_income',
    STOCKS: 'stocks',
    FUNDS: 'funds',
    SAVINGS: 'fixed_income',
    LCI_LCA: 'fixed_income',
    CRYPTO: 'crypto',
  };

   // Verifica se o type já é válido; caso contrário, usa o mapeamento
  let finalType = type.trim(); // Remove espaços em branco
  if (!validTypes.includes(finalType)) {
    finalType = typeMap[type.toUpperCase().trim()];
    console.log('Após mapeamento:', { originalType: type, mappedType: finalType });
    if (!finalType) {
      return res.status(400).json({
        error: 'Tipo de investimento inválido',
        type,
        validTypes,
      });
    }
  }

  try {
    const investment = new Investment({
      userId: new mongoose.Types.ObjectId(req.user.id), // Converte para ObjectId
      type: finalType,
      amount,
      returnRate,
      status: 'active', // Garante o valor padrão
    });
    console.log('Tentando salvar investimento:', {
      userId: req.user.id,
      type: finalType,
      amount,
      returnRate,
    });
    await investment.save();
    console.log('Investimento salvo com sucesso:', investment);
    return res.status(201).json({ message: 'Investimento criado com sucesso', investment });
  } catch (error) {
    console.error('Erro ao criar investimento:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.status(500).json({ error: 'Erro ao salvar investimento', details: error.message });
  }
};

// Obter todos os investimentos do usuário autenticado
exports.getUserInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ userId: new mongoose.Types.ObjectId(req.user.id) });
    return res.json(investments);
  } catch (error) {
    console.error('Erro ao buscar investimentos:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Erro no servidor', details: error.message });
  }
};