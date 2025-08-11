const express = require('express');
const router = express.Router();
const emprestimoController = require('../controllers/emprestimoController');

router.post('/simular', emprestimoController.simular);

module.exports = router;
