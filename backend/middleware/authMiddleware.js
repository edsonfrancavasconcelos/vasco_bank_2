// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/Usuario.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_segura';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log(`[AUTH] Verificando token para: ${req.url}`);

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('[AUTH] Token recebido:', token.substring(0, 20) + '...');
  } else {
    console.log('[AUTH] Nenhum token fornecido para:', req.url);
    return res
      .status(401)
      .json({ success: false, status: 401, data: {}, error: 'Não autorizado: Token ausente' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[AUTH] Token decodificado:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('[AUTH] Usuário não encontrado para ID:', decoded.id);
      return res
        .status(404)
        .json({ success: false, status: 404, data: {}, error: 'Usuário não encontrado' });
    }

    // Salva o documento Mongoose inteiro para permitir .save()
    req.user = user;

    console.log('[AUTH] Usuário autenticado:', req.user._id);

    next();
  } catch (err) {
    console.error('[AUTH] Erro ao verificar token:', err.message);
    return res
      .status(401)
      .json({ success: false, status: 401, data: {}, error: 'Não autorizado: Token inválido' });
  }
});
