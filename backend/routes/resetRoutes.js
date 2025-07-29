const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { resetPassword } = require('../controllers/userController');

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token é obrigatório'),
    body('newPassword').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    resetPassword(req, res, next);
  }
);

module.exports = router;
