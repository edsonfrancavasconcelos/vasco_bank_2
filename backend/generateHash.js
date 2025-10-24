// backend/generateHash.js
import bcrypt from 'bcryptjs';

export async function generateHash(senha) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(senha, salt);
}
