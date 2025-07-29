require("dotenv").config();

const config = {
  // Configurações de banco de dados
  db: {
    uri: process.env.MONGO_URI || "mongodb://localhost:3000/vasco-bank", // URL padrão se a variável de ambiente não estiver definida
  },
  // Configurações de servidor
  server: {
    port: process.env.PORT || 5000, // Porta padrão se a variável de ambiente não estiver definida
  },
  // Outras configurações podem ser adicionadas aqui conforme necessário
};

module.exports = {
  mongoURI: process.env.MONGO_URI || "mongodb://localhost:3000/vascobank",
  jwtSecret: process.env.JWT_SECRET || "segredo123",
};
