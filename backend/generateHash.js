// backend/generateHash.js
const bcrypt = require('bcryptjs');

const generateHash = async (senha) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(senha, salt);
};

module.exports = generateHash;
