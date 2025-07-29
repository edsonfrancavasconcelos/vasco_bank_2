/*
 * backend/routes/virtualCardRoutes.js
 * Atualizado para garantir que o número completo do cartão seja salvo no banco
 */

const express = require('express');
const router = express.Router();
const VirtualCard = require('../models/VirtualCard');
const User = require('../models/User');
const auth = require('../middleware/auth');

console.log('virtualCardRoutes carregado em:', new Date().toISOString());

// Listar cartões virtuais do usuário
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cards = await VirtualCard.find({ userId });

    if (!cards || cards.length === 0) {
      return res.status(404).json({ message: 'Nenhum cartão virtual encontrado' });
    }

    const formattedCards = cards.map(card => ({
      _id: card._id,
      number: card.number,
      expiry: card.expiry,
      limit: card.limit,
      type: card.type,
      status: card.status || 'active',
      fullName: card.fullName,
      brand: card.brand || 'Visa',
      logo: card.logo || 'vbank'
    }));

    res.status(200).json(formattedCards);
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    res.status(500).json({ error: 'Erro ao listar cartões virtuais' });
  }
});

// Obter cartão virtual por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    const card = await VirtualCard.findOne({ _id: cardId, userId });
    if (!card) {
      return res.status(404).json({ error: 'Cartão virtual não encontrado' });
    }

    res.status(200).json({
      _id: card._id,
      number: card.number,
      expiry: card.expiry,
      limit: card.limit,
      type: card.type,
      status: card.status || 'active',
      fullName: card.fullName,
      brand: card.brand || 'Visa',
      logo: card.logo || 'vbank',
      cvv: card.cvv
    });
  } catch (error) {
    console.error('Erro ao buscar cartão virtual:', error);
    res.status(500).json({ error: 'Erro ao buscar cartão virtual' });
  }
});

// Criar cartão virtual
router.post('/', auth, async (req, res) => {
  try {
    const { limit, type, brand = 'Visa', cvv, fullName } = req.body;
    const userId = req.user.id;

    if (!cvv || !/^[0-9]{3}$/.test(cvv)) {
      return res.status(400).json({ error: 'CVV inválido' });
    }
    if (!limit || limit <= 0) {
      return res.status(400).json({ error: 'Limite inválido' });
    }
    if (!['single-use', 'multi-use'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de cartão inválido' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Geração de número completo do cartão (com 16 dígitos reais)
    const prefix = '5123';
    const middle = Math.floor(100000000 + Math.random() * 900000000).toString();
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const number = `${prefix} ${middle.slice(0, 4)} ${middle.slice(4, 8)} ${suffix}`;

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    const expiry = `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;

    const card = new VirtualCard({
      userId,
      fullName: fullName || user.fullName,
      type,
      limit,
      brand,
      number,
      lastFour: suffix,
      expiry,
      cvv,
      logo: 'vbank',
      status: 'active',
      createdAt: new Date()
    });

    await card.save();

    res.status(201).json({
      message: 'Cartão virtual criado com sucesso',
      card: {
        _id: card._id,
        number: card.number,
        expiry: card.expiry,
        type: card.type,
        limit: card.limit,
        fullName: card.fullName,
        brand: card.brand,
        logo: card.logo,
        status: card.status
      }
    });
  } catch (error) {
    console.error('Erro ao criar cartão virtual:', error);
    res.status(500).json({ error: 'Erro ao criar cartão virtual' });
  }
});

// Excluir cartão virtual
router.delete('/:id', auth, async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    const card = await VirtualCard.findOneAndDelete({ _id: cardId, userId });
    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    res.status(200).json({ message: 'Cartão virtual excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cartão virtual:', error);
    res.status(500).json({ error: 'Erro ao excluir cartão virtual' });
  }
});

module.exports = router;
