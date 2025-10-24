import 'dotenv/config';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import Usuario from '../models/Usuario.js';
import Transaction from '../models/Transaction.js';
import { criarTransacao, anteciparFatura } from '../controllers/transactionController.js';

// Timeout maior para operações de banco
const HOOK_TIMEOUT = 30000;

// Mock do response usando Vitest
function createResMock() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('💳 Testes de Transações e Faturas', () => {
  let usuarioTeste;

  beforeAll(async () => {
    // Conectar ao MongoDB de teste
    if (!process.env.MONGO_URI_TEST) {
      throw new Error('MONGO_URI_TEST não definido no .env');
    }

    await mongoose.connect(process.env.MONGO_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Criar usuário de teste com todos os campos obrigatórios
    usuarioTeste = await Usuario.create({
      nome: 'Teste',
      numeroConta: '123456',
      saldo: 1500,
      faturaAtual: 500,
      limiteCredito: 5000,
      creditoUsado: 0,
      senha: 'senha123',   // campos obrigatórios
      cpf: '12345678901',
      email: 'teste@teste.com'
    });
  }, HOOK_TIMEOUT);

  afterAll(async () => {
    await Usuario.deleteMany({});
    await Transaction.deleteMany({});
    await mongoose.connection.close();
  }, HOOK_TIMEOUT);

  it('deve antecipar parte da fatura com sucesso', async () => {
    const req = { 
      user: { _id: usuarioTeste._id },
      body: { valorAntecipar: 200 }
    };
    const res = createResMock();

    await anteciparFatura(req, res);

    expect(res.json).toHaveBeenCalled();
    const response = res.json.mock.calls[0][0];

    expect(response.success).toBe(true);
    expect(response.saldo).toBeGreaterThanOrEqual(1300); // 1500 - 200
    expect(response.faturaAtual).toBeLessThanOrEqual(300); // 500 - 200
  }, HOOK_TIMEOUT);
});
