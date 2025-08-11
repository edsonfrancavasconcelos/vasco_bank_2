const Transaction = require("../models/Transaction");
const User = require("../models/User");

async function criarTransacao(req, res) {
  try {
    let tipo = req.params.tipo;

    const {
      operador,
      numeroCelular,
      contaOrigem,
      contaDestino,
      descricao,
      valorRecarga,
      valorDeposito,
      valorTransferencia,
      valorBoleto
    } = req.body;

    if (!tipo) {
      return res.status(400).json({ error: "Campo 'tipo' é obrigatório na URL" });
    }

    // Ajuste para compatibilidade com enum
    if (tipo === "recarga") tipo = "recarga_celular";

    let valor = valorRecarga || valorDeposito || valorTransferencia || valorBoleto;

    if (!valor) {
      return res.status(400).json({ error: "Campo 'valor' é obrigatório" });
    }

    valor = Number(valor);
    if (isNaN(valor) || valor <= 0) {
      return res.status(400).json({ error: "Valor inválido" });
    }

    const taxa = valor * 0.02;

    const novaTransacao = {
      tipo,
      valor,
      operador,
      numeroCelular,
      contaOrigem,
      contaDestino,
      descricao,
      taxa,
    };

    if (tipo === "transferencia") {
      // Quem envia é o usuário logado
      novaTransacao.deUsuario = req.user._id;

      // Buscar usuário dono da contaDestino para definir 'usuario'
      const userDestino = await User.findOne({ numeroConta: contaDestino });
      if (!userDestino) {
        return res.status(404).json({ error: "Conta destino não encontrada" });
      }
      novaTransacao.usuario = userDestino._id;
    } else {
      // Para outros tipos, o dono é o usuário logado
      novaTransacao.usuario = req.user._id;
      // Para outros tipos não incluir 'deUsuario'
      novaTransacao.deUsuario = undefined;

      // Se não for transferência, inclui chave Pix (se houver)
      novaTransacao.chave = req.body.chave || undefined;
    }

    const transacao = await Transaction.create(novaTransacao);

    res.status(201).json({
      message: "Transação registrada com sucesso",
      transacao
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar transação" });
  }
}


async function listarTransacoesComNomes(req, res) {
  try {
    // Buscar transações onde o usuário é dono ou quem enviou (para ter completo)
    const transacoes = await Transaction.find({
      $or: [{ usuario: req.user._id }, { deUsuario: req.user._id }]
    })
      .sort({ data: -1 })
      .populate('usuario', 'nome')
      .populate('deUsuario', 'nome');

    const transacoesComNomes = transacoes.map(t => ({
      _id: t._id,
      tipo: t.tipo,
      valor: t.valor,
      descricao: t.descricao,
      status: t.status,
      data: t.data,
      contaDestino: t.contaDestino,
      nomeRemetente: t.deUsuario ? t.deUsuario.nome : (t.usuario ? t.usuario.nome : null),
      nomeRecebedor: t.usuario ? t.usuario.nome : null,
    }));

    res.json(transacoesComNomes);
  } catch (err) {
    console.error('Erro ao listar transações com nomes:', err);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
}

module.exports = { criarTransacao, listarTransacoesComNomes };
