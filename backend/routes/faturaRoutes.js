// routes/faturaRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Fatura from '../models/Fatura.js';

const router = express.Router();

// POST /api/user/faturas/antecipar
router.post('/antecipar', protect, async (req, res) => {
  try {
    const { faturaId, valor, metodoPagamento } = req.body;

    // Validações
    if (!faturaId || !valor || !metodoPagamento) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios: faturaId, valor, metodoPagamento'
      });
    }

    if (valor <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valor deve ser maior que zero'
      });
    }

    const fatura = await Fatura.findOne({
      _id: faturaId,
      usuario: req.user._id,
      status: 'aberta'
    });

    if (!fatura) {
      return res.status(404).json({
        success: false,
        error: 'Fatura não encontrada ou não está aberta'
      });
    }

    if (valor > fatura.valor) {
      return res.status(400).json({
        success: false,
        error: 'Valor a antecipar não pode ser maior que o saldo da fatura'
      });
    }

    // Atualiza o valor da fatura
    fatura.valor -= valor;
    
    // Se zerar, muda status
    if (fatura.valor === 0) {
      fatura.status = 'paga';
      fatura.dataPagamento = new Date();
    }

    await fatura.save();

    res.json({
      success: true,
      mensagem: 'Antecipação realizada com sucesso!',
      data: {
        faturaId: fatura._id,
        valorRestante: fatura.valor,
        status: fatura.status
      }
    });

  } catch (err) {
    console.error('Erro em /antecipar:', err);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
});

export default router;