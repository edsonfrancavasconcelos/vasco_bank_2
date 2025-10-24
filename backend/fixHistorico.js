// backend/fixHistorico.js
import mongoose from "mongoose";
import Usuario from "./models/Usuario.js";
import dotenv from "dotenv";
dotenv.config();

async function corrigirHistorico() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado ao MongoDB");

    const usuarios = await Usuario.find();
    let corrigidos = 0;

    for (const user of usuarios) {
      let alterado = false;

      // Corrige historicoSaldo
      if (Array.isArray(user.historicoSaldo)) {
        for (const h of user.historicoSaldo) {
          if (!h.tipo) {
            h.tipo = h.tipoOperacao || "transferencia";
            alterado = true;
          }
        }
      }

      // Corrige historicoFatura
      if (Array.isArray(user.historicoFatura)) {
        for (const h of user.historicoFatura) {
          if (!h.tipo) {
            h.tipo = "fatura";
            alterado = true;
          }
        }
      }

      if (alterado) {
        await user.save({ validateBeforeSave: false });
        corrigidos++;
      }
    }

    console.log(`✅ ${corrigidos} usuários corrigidos com sucesso.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Erro ao corrigir histórico:", err.message);
  }
}

corrigirHistorico();
