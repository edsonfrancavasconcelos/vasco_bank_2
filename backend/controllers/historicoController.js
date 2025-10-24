// backend/controllers/historicoController.js
import Transaction from '../models/Transaction.js';


// Controller para retornar histórico geral do usuário autenticado
export const obterHistoricoUsuario = async (req, res) => {
  try {
    const userId = req.user.id; // ID do usuário passado pelo middleware JWT

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    // Busca todas as transações do usuário ordenadas pela data mais recente
    const historico = await Transaction.find({ usuario: userId }).sort({ data: -1 });

    return res.json({ success: true, data: historico });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

// Controller para retornar histórico somente de crédito
export const obterHistoricoCredito = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    // Busca somente transações de crédito com base no campo tipoOperacao
    const creditos = await Transaction.find({
      usuario: userId,
      tipoOperacao: 'credito',
    }).sort({ data: -1 });

    return res.json({ success: true, data: creditos });
  } catch (error) {
    console.error('Erro ao obter histórico de crédito:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};
