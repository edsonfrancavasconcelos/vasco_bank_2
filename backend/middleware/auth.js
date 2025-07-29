const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  // Obtém o cabeçalho Authorization
  const authHeader = req.headers.authorization;
  console.log("Header Authorization recebido:", authHeader);

  // Verifica se o cabeçalho existe e começa com "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Cabeçalho Authorization ausente ou inválido");
    return res
      .status(401)
      .json({ error: "Usuário não autenticado ou token inválido" });
  }

  // Extrai o token
  const token = authHeader.replace("Bearer ", "");
  console.log("Token extraído:", token);

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Usuário decodificado no middleware:", decoded);

    // Obtém o accountNumber do token ou do banco de dados
    let accountNumber = decoded.accountNumber;
    if (!accountNumber) {
      const user = await User.findById(decoded.id).select("accountNumber");
      if (!user) {
        console.log("Usuário não encontrado no banco de dados");
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      accountNumber = user.accountNumber;
    }

    // Adiciona os dados do usuário à requisição
    req.user = { id: decoded.id, accountNumber };
    console.log("req.user no middleware:", req.user);

    next();
  } catch (error) {
    console.error("Erro ao verificar token:", error.message);
    return res
      .status(401)
      .json({ error: "Usuário não autenticado ou token inválido" });
  }
};

module.exports = auth;