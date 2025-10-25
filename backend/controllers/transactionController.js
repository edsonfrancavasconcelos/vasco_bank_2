import Transaction from '../models/Transaction.js';
import Usuario from '../models/Usuario.js';

// =================== FUNÇÃO AUXILIAR ===================
async function limparFaturasPendentes(usuarioId) {
  const faturasPendentes = await Transaction.find({
    usuario: usuarioId,
    tipo: 'fatura_aberta',
    status: 'pendente',
  }).sort({ createdAt: 1 });

  if (faturasPendentes.length <= 1) return;

  for (let i = 0; i < faturasPendentes.length - 1; i++) {
    await Transaction.findByIdAndDelete(faturasPendentes[i]._id);
  }
}

// =================== ATUALIZA FATURA ABERTA ===================
export async function atualizarFaturaAberta(usuarioId) {
  let fatura = await Transaction.findOne({
    usuario: usuarioId,
    tipo: 'fatura_aberta',
    status: 'pendente'
  }).sort({ createdAt: -1 });

  if (!fatura) {
    fatura = await Transaction.create({
      usuario: usuarioId,
      tipo: 'fatura_aberta',
      descricao: 'Fatura aberta',
      valor: 0,
      tipoOperacao: 'credito',
      status: 'pendente',
    });
  }

  const transacoes = await Transaction.find({
    usuario: usuarioId,
    tipoOperacao: 'debito',
    status: 'concluida',
    $or: [
      { tipo: { $ne: 'antecipacao' } },
      { tipo: { $ne: 'pagamento_fatura' } }
    ],
  });

  let totalDebito = 0;
  transacoes.forEach(tx => totalDebito += Number(tx.valor) || 0);

  fatura.valor = totalDebito;
  await fatura.save();

  const usuario = await Usuario.findById(usuarioId);
  if (usuario) {
    usuario.faturaAtual = fatura.valor;
    await usuario.save();
  }

  return fatura;
}

// =================== CRIAR TRANSAÇÃO ===================
export async function criarTransacao(req, res) {
  try {
    const { tipo, valor, contaDestino, descricao, operador, numeroCelular, contaOrigem, tipoOperacao } = req.body;

    if (!tipo) return res.status(400).json({ success: false, error: 'Tipo de transação é obrigatório' });

    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) return res.status(400).json({ success: false, error: 'Valor inválido' });

    const usuario = await Usuario.findById(req.user._id);
    if (!usuario) return res.status(401).json({ success: false, error: 'Usuário não autenticado' });

    const tipoLower = String(tipo).toLowerCase();
    const tipoOperacaoFinal = String(tipoOperacao || (tipoLower === 'deposito' ? 'credito' : 'debito')).toLowerCase();

    let taxa = 0;
    let descricaoFinal = descricao || '';
    let usuarioDestino = null;
    let nomeRecebedor = null;

    switch (tipoLower) {
      case 'deposito':
        descricaoFinal = `Depósito de ${contaOrigem || 'conta externa'}`;
        await usuario.atualizarSaldo({ valor: valorNum, tipoOperacao: 'credito', descricao: descricaoFinal });
        nomeRecebedor = usuario.nome;
        break;

      case 'pagamento':
      case 'pagamento_boleto':
        taxa = Number((valorNum * 0.02).toFixed(2));
        descricaoFinal = `Pagamento de boleto: ${descricao || ''}`;
        await usuario.atualizarSaldo({ valor: valorNum + taxa, tipoOperacao: 'debito', descricao: descricaoFinal });
        nomeRecebedor = 'Boleto';
        break;

      case 'recarga':
        taxa = Number((valorNum * 0.01).toFixed(2));
        descricaoFinal = `Recarga para ${operador || 'operador'} (${numeroCelular || ''})`;
        await usuario.atualizarSaldo({ valor: valorNum + taxa, tipoOperacao: 'debito', descricao: descricaoFinal });
        nomeRecebedor = operador || 'Operador';
        break;

      case 'transferencia':
        taxa = Number((valorNum * 0.015).toFixed(2));
        if (!contaDestino) return res.status(400).json({ success: false, error: 'Conta de destino é obrigatória' });

        usuarioDestino = await Usuario.findOne({ numeroConta: contaDestino });
        if (!usuarioDestino) return res.status(404).json({ success: false, error: 'Conta de destino não encontrada' });
        if (usuarioDestino._id.toString() === usuario._id.toString())
          return res.status(400).json({ success: false, error: 'Não é possível transferir para a própria conta' });

        descricaoFinal = `Transferência para ${usuarioDestino.nome} (${contaDestino})`;
        await usuario.atualizarSaldo({ valor: valorNum + taxa, tipoOperacao: 'debito', descricao: descricaoFinal });
        await usuarioDestino.atualizarSaldo({ valor: valorNum, tipoOperacao: 'credito', descricao: `Recebido de ${usuario.nome} (${usuario.numeroConta})` });
        nomeRecebedor = usuarioDestino.nome;

        await atualizarFaturaAberta(usuarioDestino._id);
        break;

      default:
        return res.status(400).json({ success: false, error: 'Tipo de transação inválido' });
    }

    const transacao = await Transaction.create({
      tipo: tipoLower,
      valor: tipoOperacaoFinal === 'debito' ? -valorNum : valorNum,
      operador: operador || null,
      numeroCelular: numeroCelular || null,
      contaOrigem: contaOrigem || usuario.numeroConta,
      contaDestino: contaDestino || (usuarioDestino ? usuarioDestino.numeroConta : null),
      descricao: descricaoFinal,
      tipoOperacao: tipoOperacaoFinal,
      taxa,
      status: 'concluida',
      usuario: usuario._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: nomeRecebedor || 'N/A',
      data: new Date(),
    });

    if (tipoOperacaoFinal === 'credito') {
      await limparFaturasPendentes(usuario._id);
      await atualizarFaturaAberta(usuario._id);
    }

    const usuarioAtualizado = await Usuario.findById(usuario._id).select('saldo faturaAtual creditoUsado').lean();

    return res.json({
      success: true,
      data: transacao,
      saldoAtual: Number(usuarioAtualizado?.saldo || 0).toFixed(2),
      faturaAtual: Number(usuarioAtualizado?.faturaAtual || 0).toFixed(2),
      creditoUsado: Number(usuarioAtualizado?.creditoUsado || 0).toFixed(2),
    });

  } catch (err) {
    console.error('Erro ao criar transação:', err);
    return res.status(500).json({ success: false, error: `Erro ao criar transação: ${err.message}` });
  }
}

// =================== ANTECIPAR FATURA (CORRIGIDA E PADRONIZADA) ===================
export const anteciparFatura = async (req, res) => {
  try {
    const { valor } = req.body;
    const usuarioId = req.user._id;

    // Validação de entrada
    const valorAntecipar = Number(valor);
    if (!valor || isNaN(valorAntecipar) || valorAntecipar <= 0) {
      return res.status(400).json({
        success: false,
        mensagem: 'Valor inválido. Deve ser maior que zero.'
      });
    }

    // Limpa duplicatas
    await limparFaturasPendentes(usuarioId);

    // Busca ou cria fatura aberta
    let fatura = await Transaction.findOne({
      usuario: usuarioId,
      tipo: 'fatura_aberta',
      status: 'pendente'
    }).sort({ createdAt: -1 });

    if (!fatura) {
      fatura = await Transaction.create({
        usuario: usuarioId,
        tipo: 'fatura_aberta',
        descricao: 'Fatura aberta',
        valor: 0,
        tipoOperacao: 'credito',
        status: 'pendente',
      });
    }

    // Recalcula fatura real
    const transacoesDebito = await Transaction.find({
      usuario: usuarioId,
      tipoOperacao: 'debito',
      status: 'concluida',
      tipo: { $ne: 'antecipacao' }
    });

    const totalDebito = transacoesDebito.reduce((acc, tx) => acc + (Number(tx.valor) || 0), 0);
    fatura.valor = totalDebito > 0 ? totalDebito : 0;
    await fatura.save();

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(401).json({ success: false, mensagem: 'Usuário não encontrado' });

    // Validações
    if (fatura.valor <= 0) {
      return res.status(400).json({ success: false, mensagem: 'Não há fatura para antecipar.' });
    }

    if (valorAntecipar > usuario.saldo) {
      return res.status(400).json({
        success: false,
        mensagem: `Saldo insuficiente. Disponível: R$ ${usuario.saldo.toFixed(2)}`
      });
    }

    if (valorAntecipar > fatura.valor) {
      return res.status(400).json({
        success: false,
        mensagem: `Valor excede a fatura. Máximo: R$ ${fatura.valor.toFixed(2)}`
      });
    }

    // Executa antecipação
    usuario.saldo -= valorAntecipar;
    fatura.valor -= valorAntecipar;

    if (fatura.valor <= 0) {
      fatura.valor = 0;
      fatura.status = 'concluida';
    }

    await usuario.save();
    await fatura.save();

    // Registra transação
    await Transaction.create({
      usuario: usuarioId,
      tipo: 'antecipacao',
      descricao: `Antecipação de R$ ${valorAntecipar.toFixed(2)} da fatura`,
      valor: -valorAntecipar,
      tipoOperacao: 'debito',
      status: 'concluida',
      referenciaFatura: fatura._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: 'Cartão de Crédito',
      data: new Date(),
      taxa: 0,
    });

    return res.status(200).json({
      success: true,
      mensagem: 'Antecipação realizada com sucesso!',
      valorAntecipado: valorAntecipar.toFixed(2),
      novoSaldo: usuario.saldo.toFixed(2),
      faturaRestante: fatura.valor.toFixed(2)
    });

  } catch (error) {
    console.error('Erro ao antecipar fatura:', error);
    return res.status(500).json({
      success: false,
      mensagem: 'Erro interno do servidor.',
      erro: error.message
    });
  }
};

// =================== PAGAR FATURA ===================
export async function pagarFatura(req, res) {
  try {
    const usuario = await Usuario.findById(req.user._id);
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });

    await limparFaturasPendentes(usuario._id);
    await atualizarFaturaAberta(usuario._id);

    const valorFatura = Number(usuario.faturaAtual || 0);
    if (valorFatura <= 0) return res.status(400).json({ success: false, error: 'Não há fatura a pagar.' });
    if (usuario.saldo < valorFatura) return res.status(400).json({ success: false, error: 'Saldo insuficiente.' });
    if (new Date().getDate() < 10) return res.status(400).json({ success: false, error: 'Fatura só pode ser paga a partir do dia 10.' });

    await usuario.atualizarSaldo({
      valor: valorFatura,
      tipoOperacao: 'debito',
      descricao: 'Pagamento de fatura do cartão de crédito'
    });

    const transacao = await Transaction.create({
      tipo: 'pagamento_fatura',
      valor: -valorFatura,
      descricao: 'Pagamento de fatura do cartão de crédito',
      tipoOperacao: 'debito',
      status: 'concluida',
      usuario: usuario._id,
      nomeRemetente: usuario.nome,
      nomeRecebedor: 'Cartão de Crédito',
      data: new Date(),
      taxa: 0,
    });

    await atualizarFaturaAberta(usuario._id);

    const usuarioAtualizado = await Usuario.findById(usuario._id).select('saldo faturaAtual creditoUsado').lean();

    return res.json({
      success: true,
      message: 'Fatura paga com sucesso.',
      saldo: Number(usuarioAtualizado?.saldo || 0).toFixed(2),
      faturaAtual: Number(usuarioAtualizado?.faturaAtual || 0).toFixed(2),
      creditoUsado: Number(usuarioAtualizado?.creditoUsado || 0).toFixed(2),
      transacao,
    });
  } catch (err) {
    console.error('Erro em pagarFatura:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =================== LISTAR TRANSAÇÕES ===================
export async function listarTransacoesComNomes(req, res) {
  try {
    const transacoes = await Transaction.find({ usuario: req.user._id })
      .sort({ data: -1 })
      .limit(200)
      .lean();

    const formatadas = transacoes.map(tx => ({
      _id: tx._id,
      tipo: tx.tipo,
      valor: Number(tx.valor || 0).toFixed(2),
      descricao: tx.descricao || '',
      status: tx.status || 'concluida',
      data: tx.data,
      contaDestino: tx.contaDestino || '',
      contaOrigem: tx.contaOrigem || '',
      operador: tx.operador || '',
      numeroCelular: tx.numeroCelular || '',
      tipoOperacao: tx.tipoOperacao || 'debito',
      taxa: Number(tx.taxa || 0).toFixed(2),
      nomeRemetente: tx.nomeRemetente || 'N/A',
      nomeRecebedor: tx.nomeRecebedor || 'N/A',
    }));

    return res.json({ success: true, data: formatadas });
  } catch (err) {
    console.error('Erro ao listar transações:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =================== OUTRAS FUNÇÕES ===================
export async function getFaturaAtual(req, res) {
  try {
    const usuario = await Usuario.findById(req.user._id).select('faturaAtual limiteCredito creditoUsado');
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    return res.json({
      success: true,
      faturaAtual: Number(usuario.faturaAtual || 0).toFixed(2),
      limiteCredito: Number(usuario.limiteCredito || 0).toFixed(2),
      creditoUsado: Number(usuario.creditoUsado || 0).toFixed(2),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function listarFaturas(req, res) {
  try {
    const faturas = await Transaction.find({
      usuario: req.user._id,
      tipo: 'fatura_aberta'
    }).sort({ data: -1 }).lean();

    return res.json({
      success: true,
      data: faturas.map(f => ({
        _id: f._id,
        valor: Number(f.valor || 0).toFixed(2),
        status: f.status,
        data: f.data,
        descricao: f.descricao,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}