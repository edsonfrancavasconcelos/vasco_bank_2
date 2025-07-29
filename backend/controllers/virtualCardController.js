const VirtualCard = require('../models/VirtualCard');
const User = require('../models/User');


// Funções utilitárias para gerar dados de cartão (exemplo simplificado)
const generateCardNumber = () => {
  return '**** **** **** ' + Math.floor(1000 + Math.random() * 9000); // Substitua por uma lógica real
};
const generateExpiryDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 4);
  return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
};
const generateCvv = () => {
  return Math.floor(100 + Math.random() * 900).toString();
};

exports.createVirtualCard = async (req, res) => {
  try {
    const { userId, limit, type, brand, fullName } = req.body;

    // Validação dos campos fornecidos
    if (!userId || !limit || !type || !brand || !fullName) {
      return res.status(400).json({ message: 'Campos obrigatórios: userId, limit, type, brand, fullName' });
    }

    // Verifica se o userId corresponde ao usuário autenticado
    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Usuário não autorizado' });
    }

    // Verifica se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const getVirtualCards = async (req, res) => {
  try {
    const cards = await Card.find({
      userId: req.user.id,
      type: 'virtual'
    }).select('number lastFour fullName expiry limit status virtualType type brand logo');

    res.json(cards);
  } catch (error) {
    console.error('Erro ao buscar cartões virtuais:', error);
    res.status(500).json({ error: 'Erro ao buscar cartões virtuais' });
  }
};

    // Cria o cartão virtual
    const newCard = new VirtualCard({
      userId,
      limit,
      type,
      brand,
      fullName,
      number: generateCardNumber(),
      expiry: generateExpiryDate(),
      cvv: generateCvv(),
      status: 'active',
    });

    await newCard.save();
    res.status(201).json({ card: newCard });
  } catch (error) {
    console.error('Erro ao criar cartão virtual:', error);
    res.status(400).json({ message: error.message || 'Erro ao criar cartão virtual' });
  }
};