const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token recebido:', token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);

      const user = await User.findById(decoded.id).select('-senha');
      console.log('Usuário encontrado:', user);

      if (!user) {
        console.log('Usuário não encontrado para o ID do token');
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      // Aqui a correção: definir req.user como objeto usuário completo
      req.user = user;
      console.log('Middleware - req.user definido:', req.user);

      next();
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      return res.status(401).json({ error: 'Não autorizado, token inválido' });
    }
  } else {
    console.log('Token ausente no cabeçalho Authorization');
    return res.status(401).json({ error: 'Não autorizado, token ausente' });
  }
});

module.exports = { protect };
