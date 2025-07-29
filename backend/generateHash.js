const bcrypt = require('bcrypt');

async function generateHash() {
  const password = '123456'; // Senha que você tá usando no login
  const hash = await bcrypt.hash(password, 10);
  console.log('Novo hash:', hash);
}

generateHash();