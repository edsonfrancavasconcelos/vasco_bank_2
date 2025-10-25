// ------------------- Imports -------------------
import Usuario from '../models/Usuario.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;



// ------------------- Controller -------------------
export async function login(req, res) {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(401).json({ msg: 'Email não encontrado' });
    }

    const senhaCorreta = await usuario.comparePassword(senha);
    if (!senhaCorreta) {
      return res.status(401).json({ msg: 'Senha incorreta' });
    }

    const token = jwt.sign({ id: usuario._id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        numeroConta: usuario.numeroConta,
        saldo: usuario.saldo
      }
    });

  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
}
