// backend/controllers/pixController.js

const PixKey = require('../models/PixKey');

exports.getPixKeys = async (req, res) => {
  try {
    const keys = await PixKey.find({ owner: req.user.id });
    res.status(200).json(keys);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar chaves Pix' });
  }
};

exports.createPixKey = async (req, res) => {
  try {
    const newKey = new PixKey({ ...req.body, owner: req.user.id });
    await newKey.save();
    res.status(201).json(newKey);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao registrar chave Pix' });
  }
};
