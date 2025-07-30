const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Retorna dados do usuário autenticado
// @route   GET /api/users/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

module.exports = {
  getUserProfile
};
