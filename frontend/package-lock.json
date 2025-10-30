// backend/utils/faturaScheduler.js
import cron from "node-cron";
import Transaction from "../models/Transaction.js";
import Usuario from "../models/Usuario.js";

// ===================================================
// Atualiza status das faturas (executado diariamente)
// ===================================================
export async function atualizarStatusFaturas() {
  try {
    const hoje = new Date();

    // 1️⃣ Faturas abertas cujo vencimento chegou → “aguardando_pagamento”
    await Transaction.updateMany(
      {
        tipo: "fatura_aberta",
        status: "pendente",
        dataVencimento: { $lte: hoje },
      },
      { $set: { status: "aguardando_pagamento" } }
    );

    // 2️⃣ Faturas aguardando pagamento vencidas há 3 dias → “atrasada”
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

    await Transaction.updateMany(
      {
        tipo: "fatura_aberta",
        status: "aguardando_pagamento",
        dataVencimento: { $lt: tresDiasAtras },
      },
      { $set: { status: "atrasada" } }
    );

    // 3️⃣ Atualiza campo faturaAtual no usuário
    const usuarios = await Usuario.find({});
    for (const user of usuarios) {
      const faturaAberta = await Transaction.findOne({
        usuario: user._id,
        tipo: "fatura_aberta",
        status: { $in: ["pendente", "aguardando_pagamento", "atrasada"] },
      });

      user.faturaAtual = faturaAberta ? faturaAberta.valor : 0;
      await user.save();
    }

    console.log("🔄 Status das faturas atualizado com sucesso");
  } catch (err) {
    console.error("Erro ao atualizar status das faturas:", err);
  }
}

// ===================================================
// Função para rodar o cronjob automaticamente
// ===================================================
export function iniciarAgendamentoFaturas() {
  // Executa todo dia à meia-noite
  cron.schedule("0 0 * * *", () => {
    console.log("⏰ Executando atualização de status das faturas...");
    atualizarStatusFaturas();
  });

  console.log("✅ Agendamento de faturas iniciado (rodando todo dia à meia-noite)");
}
