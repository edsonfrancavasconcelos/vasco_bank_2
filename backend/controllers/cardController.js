const Card = require('../models/Card');

exports.getCards = async (req, res) => {
  try {
    const cards = await Card.find({ owner: req.user.id });
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar cartões' });
  }
};

exports.createVirtualCard = async (req, res) => {
  try {
    const newCard = new Card({ ...req.body, owner: req.user.id, type: 'virtual' });
    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar cartão virtual' });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!card) return res.status(404).json({ message: 'Cartão não encontrado' });

    res.status(200).json({ message: 'Cartão deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar cartão' });
  }
};

exports.replaceCard = async (req, res) => {
  // Aqui você coloca a lógica para substituir o cartão
  res.status(501).json({ message: 'Funcionalidade substituir cartão ainda não implementada' });
};

exports.unlockCard = async (req, res) => {
  // Aqui você coloca a lógica para desbloquear o cartão
  res.status(501).json({ message: 'Funcionalidade desbloquear cartão ainda não implementada' });
};
