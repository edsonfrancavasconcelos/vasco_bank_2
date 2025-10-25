// backend/utils/faturaScheduler.js
import cron from "node-cron";
import Fatura from "../models/Fatura.js";

export async function atualizarStatusFaturas() {
  try {
    const hoje = new Date();

    // Faturas abertas cujo vencimento chegou → “aguardando_pagamento”
    await Fatura.updateMany(
      { status: "aberta", dataVencimento: { $lte: hoje } },
      { $set: { status: "aguardando_pagamento" } }
    );

    // Faturas aguardando pagamento e vencidas há 3 dias → “atrasada”
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

    await Fatura.updateMany(
      { status: "aguardando_pagamento", dataVencimento: { $lt: tresDiasAtras } },
      { $set: { status: "atrasada" } }
    );

    console.log("🔄 Status das faturas atualizado com sucesso");
  } catch (err) {
    console.error("Erro ao atualizar status das faturas:", err);
  }
}

// Função para rodar o cronjob
export function iniciarAgendamentoFaturas() {
  // Executa todo dia à meia-noite
  cron.schedule("0 0 * * *", () => {
    console.log("⏰ Executando atualização de status das faturas...");
    atualizarStatusFaturas();
  });

  console.log("✅ Agendamento de faturas iniciado (rodando todo dia à meia-noite)");
}
