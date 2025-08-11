console.log(`[${new Date().toISOString()}] pix.js carregado`);

function abrirModal(titulo, conteudoHTML, onConfirmar) {
  const modalExistente = document.getElementById('modalPix');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.id = 'modalPix';
  Object.assign(modal.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#222',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.7)',
    color: 'white',
    zIndex: 10000,
    width: '320px',
    maxHeight: '90vh',
    overflowY: 'auto',
  });

  modal.innerHTML = `
    <h2 style="color: #ff6600; margin-bottom: 10px;">${titulo}</h2>
    <div>${conteudoHTML}</div>
    <div style="margin-top: 20px; text-align: right;">
      <button id="btnCancelar" style="background: #555; color: #fff; border:none; padding: 8px 16px; margin-right: 10px; border-radius: 6px; cursor: pointer;">Cancelar</button>
      ${onConfirmar ? '<button id="btnConfirmar" style="background: #ff6600; color: #fff; border:none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Confirmar</button>' : ''}
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById('btnCancelar').onclick = () => modal.remove();
  if (onConfirmar) document.getElementById('btnConfirmar').onclick = onConfirmar;
}

function abrirModalSimples(titulo, conteudoHTML) {
  const modalExistente = document.getElementById('modalPix');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.id = 'modalPix';
  Object.assign(modal.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#222',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.7)',
    color: 'white',
    zIndex: 10000,
    width: '320px',
    maxHeight: '90vh',
    overflowY: 'auto',
  });

  modal.innerHTML = `
    <h2 style="color: #ff6600; margin-bottom: 10px;">${titulo}</h2>
    <div>${conteudoHTML}</div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

const isLoggedIn = () => !!localStorage.getItem('token');

const requireLogin = (action) => {
  if (!isLoggedIn()) {
    alert('Faça login para acessar esta funcionalidade.');
    return;
  }
  return action();
};

function enviarPix() {
  requireLogin(() => {
    abrirModal('Enviar Pix', `
      <label>Chave destino:<br/>
        <input id="inputChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: email, CPF, telefone ou chave aleatória"/>
      </label><br/><br/>
      <label>Valor:<br/>
        <input id="inputValor" type="number" min="0.01" step="0.01" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
      </label>
      <label>Descrição (opcional):<br/>
        <input id="inputDescricao" type="text" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: Pagamento de serviço"/>
      </label>
    `, async () => {
      const chave = document.getElementById('inputChave').value.trim();
      const valor = parseFloat(document.getElementById('inputValor').value);
      const descricao = document.getElementById('inputDescricao').value.trim();

      if (!chave) return alert('Informe a chave destino.');
      if (!valor || valor <= 0) return alert('Informe um valor válido.');

      try {
        console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/enviar:`, { chave, valor, descricao });
        const res = await fetch('/api/pix/enviar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ chave, valor, descricao }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao enviar Pix.');
        console.log(`[${new Date().toISOString()}] Pix enviado:`, data);
        mostrarCardPix({ deUsuario: 'Você', paraChave: chave, valor, descricao, data: new Date() });
        alert('Pix enviado com sucesso!');
        document.getElementById('modalPix').remove();
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Erro em enviarPix:`, e.message);
        alert(`Erro: ${e.message}`);
      }
    });
  });
}

async function receberPix() {
  requireLogin(async () => {
    abrirModal('Receber Pix', '<p>Carregando chaves...</p>');
    try {
      console.log(`[${new Date().toISOString()}] Buscando chaves em /api/pix/chaves`);
      const resChaves = await fetch('/api/pix/chaves', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const chaves = await resChaves.json();
      if (!resChaves.ok) throw new Error(chaves.error || 'Erro ao buscar chaves');
      if (!chaves.length) {
        document.querySelector('#modalPix div:nth-child(2)').innerHTML = '<p>Nenhuma chave Pix cadastrada. Cadastre uma chave primeiro.</p>';
        return;
      }

      abrirModal('Receber Pix', `
        <label>Chave Pix:<br/>
          <select id="inputChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;">
            <option value="">Selecione uma chave...</option>
            ${chaves.map(c => `<option value="${c.valor}">${c.tipo.toUpperCase()}: ${c.valor}</option>`).join('')}
          </select>
        </label><br/><br/>
        <label>Valor (opcional):<br/>
          <input id="inputValor" type="number" min="0.01" step="0.01" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: 100.00" />
        </label><br/><br/>
        <label>Descrição (opcional):<br/>
          <input id="inputDescricao" type="text" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: Pagamento de serviço" />
        </label>
      `, async () => {
        const chave = document.getElementById('inputChave').value.trim();
        const valor = parseFloat(document.getElementById('inputValor').value) || undefined;
        const descricao = document.getElementById('inputDescricao').value.trim() || undefined;

        if (!chave) return alert('Selecione uma chave Pix.');

        try {
          console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/receber:`, { chave, valor, descricao });
          const res = await fetch('/api/pix/receber', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ chave, valor, descricao }),
          });
          const text = await res.text();
          if (!res.ok) {
            try {
              const data = JSON.parse(text);
              throw new Error(data.error || 'Erro ao gerar QR Code');
            } catch {
              throw new Error('Resposta não é JSON válido: ' + text);
            }
          }
          const data = JSON.parse(text);
          if (!data.qrCodeBase64 || !data.qrCodeBase64.startsWith('data:image/png;base64,')) {
            throw new Error('QR Code inválido ou não recebido.');
          }
          console.log(`[${new Date().toISOString()}] QR Code recebido, tamanho: ${data.qrCodeBase64.length}`);
          abrirModalSimples('QR Code Pix', `
            <img src="${data.qrCodeBase64}" alt="QR Code Pix" style="width: 100%; height: auto;"/>
            <p style="margin-top: 10px; font-size: 14px;">Use esse QR code para receber pagamentos Pix.</p>
            <p style="font-size: 12px; word-break: break-all;">Copia e Cola: ${data.pixPayload}</p>
            <button onclick="navigator.clipboard.writeText('${data.pixPayload}').then(() => alert('Código copiado!'))" style="background: #ff6600; color: #fff; border:none; padding: 8px 16px; margin-top: 10px; margin-right: 10px; border-radius: 6px; cursor: pointer;">Copiar Código</button>
            <button onclick="document.getElementById('modalPix').remove()" style="background: #555; color: #fff; border:none; padding: 8px 16px; margin-top: 10px; border-radius: 6px; cursor: pointer;">Voltar</button>
          `);
        } catch (e) {
          console.error(`[${new Date().toISOString()}] Erro em receberPix:`, e.message);
          abrirModal('Erro', `<p style="color:red;">${e.message}</p>`);
        }
      });
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Erro ao buscar chaves:`, e.message);
      document.querySelector('#modalPix div:nth-child(2)').innerHTML = `<p style="color:red;">${e.message}</p>`;
    }
  });
}

function agendarPix() {
  requireLogin(() => {
    abrirModal('Agendar Pix', `
      <label>Chave destino:<br/>
        <input id="inputChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: email, CPF, telefone ou chave aleatória"/>
      </label><br/><br/>
      <label>Valor:<br/>
        <input id="inputValor" type="number" min="0.01" step="0.01" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
      </label><br/><br/>
      <label>Data de agendamento:<br/>
        <input id="inputDataAgendamento" type="datetime-local" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
      </label><br/><br/>
      <label>Descrição (opcional):<br/>
        <input id="inputDescricao" type="text" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: Pagamento de serviço" />
      </label>
    `, async () => {
      const chave = document.getElementById('inputChave').value.trim();
      const valor = parseFloat(document.getElementById('inputValor').value);
      const dataAgendamento = document.getElementById('inputDataAgendamento').value;
      const descricao = document.getElementById('inputDescricao').value.trim();

      if (!chave || !valor || !dataAgendamento) return alert('Chave, valor e data de agendamento são obrigatórios.');

      try {
        console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/agendar:`, { chave, valor, dataAgendamento, descricao });
        const res = await fetch('/api/pix/agendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ chave, valor, dataAgendamento, descricao }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao agendar Pix.');
        console.log(`[${new Date().toISOString()}] Pix agendado:`, data);
        alert(`Pix agendado com sucesso: ${data.message}`);
        document.getElementById('modalPix').remove();
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Erro em agendarPix:`, e.message);
        alert(`Erro: ${e.message}`);
      }
    });
  });
}

function cobrarPix() {
  requireLogin(() => {
    abrirModal('Criar Cobrança Pix', `
      <label>Chave Pix:<br/>
        <input id="inputChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Digite a chave Pix" />
      </label><br/><br/>
      <label>Valor:<br/>
        <input id="inputValor" type="number" min="0.01" step="0.01" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Digite o valor" />
      </label><br/><br/>
      <label>Descrição (opcional):<br/>
        <input id="inputDescricao" type="text" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Descrição (opcional)" />
      </label>
    `, async () => {
      const chave = document.getElementById('inputChave').value.trim();
      const valor = parseFloat(document.getElementById('inputValor').value);
      const descricao = document.getElementById('inputDescricao').value.trim();

      if (!chave || !valor) return alert('Chave e valor são obrigatórios.');

      try {
        console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/cobrar:`, { chave, valor, descricao });
        const res = await fetch('/api/pix/cobrar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ chave, valor, descricao }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar cobrança Pix.');
        console.log(`[${new Date().toISOString()}] Cobrança criada:`, data);
        abrirModalSimples('Cobrança Pix Criada', `
          <p>${data.message}</p>
          <img src="${data.qrCodeBase64}" alt="QR Code Pix" style="width: 100%; height: auto;"/>
          <p style="margin-top: 10px; font-size: 14px;">Use esse QR code para receber o pagamento.</p>
          <p style="font-size: 12px; word-break: break-all;">Copia e Cola: ${data.pixPayload}</p>
          <button onclick="navigator.clipboard.writeText('${data.pixPayload}').then(() => alert('Código copiado!'))" style="background: #ff6600; color: #fff; border:none; padding: 8px 16px; margin-top: 10px; margin-right: 10px; border-radius: 6px; cursor: pointer;">Copiar Código</button>
          <button onclick="document.getElementById('modalPix').remove()" style="background: #555; color: #fff; border:none; padding: 8px 16px; margin-top: 10px; border-radius: 6px; cursor: pointer;">Voltar</button>
        `);
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Erro em cobrarPix:`, e.message);
        alert(`Erro: ${e.message}`);
      }
    });
  });
}

function lerQRCode() {
  requireLogin(() => {
    abrirModal('Ler QR Code Pix', `
      <p>Insira o código Pix ou chave manualmente:</p>
      <input id="inputQRCode" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Cole o código Pix ou digite a chave" />
    `, async () => {
      const codigo = document.getElementById('inputQRCode').value.trim();
      if (!codigo) return alert('Informe o código Pix ou uma chave válida.');

      try {
        console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/ler-qrcode:`, { codigo });
        const res = await fetch('/api/pix/ler-qrcode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ codigo }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao processar o código Pix.');
        console.log(`[${new Date().toISOString()}] Código Pix lido:`, data);
        alert(`Informações salvas: ${data.message}`);
        document.getElementById('modalPix').remove();
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Erro em lerQRCode:`, e.message);
        alert(`Erro: ${e.message}`);
      }
    });
  });
}

async function pixCopiaCola() {
  requireLogin(async () => {
    abrirModal('Pix Copia e Cola', '<p>Carregando chave Pix...</p>');
    try {
      console.log(`[${new Date().toISOString()}] Buscando chaves em /api/pix/chaves`);
      const res = await fetch('/api/pix/chaves', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const chaves = await res.json();
      if (!res.ok) throw new Error(chaves.error || 'Erro ao buscar chaves');
      const html = chaves.length
        ? chaves.map(c => `
            <div style="margin-bottom:10px; padding:8px; background:#333; border-radius:4px; cursor:pointer;" onclick="navigator.clipboard.writeText('${c.valor}').then(() => alert('Chave copiada: ${c.valor}'));">
              <strong>${c.tipo.toUpperCase()}:</strong> ${c.valor}
            </div>`).join('')
        : '<p>Nenhuma chave cadastrada.</p>';
      document.querySelector('#modalPix div:nth-child(2)').innerHTML = html;
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Erro em pixCopiaCola:`, e.message);
      document.querySelector('#modalPix div:nth-child(2)').innerHTML = `<p style="color:red;">${e.message}</p>`;
    }
  });
}

function cadastrarChavePix() {
  requireLogin(() => {
    abrirModal('Cadastrar Chave Pix', `
      <label>Tipo da chave:<br/>
        <select id="inputTipoChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;">
          <option value="">Selecione...</option>
          <option value="email">Email</option>
          <option value="cpf">CPF</option>
          <option value="telefone">Telefone</option>
          <option value="aleatorio">Aleatório</option>
        </select>
      </label><br/><br/>
      <label>Valor da chave:<br/>
        <input id="inputValorChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Digite o valor da chave" />
      </label>
    `, async () => {
      const tipo = document.getElementById('inputTipoChave').value;
      const valor = document.getElementById('inputValorChave').value.trim();

      if (!tipo) return alert('Selecione o tipo da chave.');
      if (!valor) return alert('Informe o valor da chave.');

      try {
        console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/chaves:`, { tipo, valor });
        const res = await fetch('/api/pix/chaves', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ tipo, valor }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar chave.');
        console.log(`[${new Date().toISOString()}] Chave Pix cadastrada:`, data);
        alert('Chave Pix cadastrada com sucesso!');
        document.getElementById('modalPix').remove();
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Erro em cadastrarChavePix:`, e.message);
        alert(`Erro: ${e.message}`);
      }
    });
  });
}

async function verMinhasChaves() {
  requireLogin(async () => {
    abrirModal('Minhas Chaves Pix', '<p>Carregando chaves...</p>');
    try {
      console.log(`[${new Date().toISOString()}] Buscando chaves em /api/pix/chaves`);
      const res = await fetch('/api/pix/chaves', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const chaves = await res.json();
      if (!res.ok) throw new Error(chaves.error || 'Erro ao carregar chaves');
      const lista = chaves.length
        ? '<ul style="padding-left: 20px;">' + chaves.map(c => `<li>${c.tipo.toUpperCase()}: ${c.valor}</li>`).join('') + '</ul>'
        : '<p>Nenhuma chave cadastrada.</p>';
      document.querySelector('#modalPix div:nth-child(2)').innerHTML = lista;
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Erro em verMinhasChaves:`, e.message);
      document.querySelector('#modalPix div:nth-child(2)').innerHTML = `<p style="color:red;">${e.message}</p>`;
    }
  });
}
async function carregarPixTransacoes() {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/transactions/pix", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const transacoes = await res.json();

  const container = document.getElementById("pixTransacoesContainer");
  container.innerHTML = ""; // limpa os cards antes

  transacoes.forEach(tx => {
    // Defina nomes para mostrar
    const nomeRemetente = tx.nomeRemetente || "Você";
    const nomeRecebedor = tx.nomeRecebedor || tx.chave || "Desconhecido";

    // Formata a data
    const dataFormatada = new Date(tx.data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });

    // Monta o HTML do card
    const cardHTML = `
      <div class="cardPix" style="background:#222; color:#fff; padding:15px; border-radius:10px; margin-bottom:10px;">
        <p><strong>Enviado por:</strong> ${nomeRemetente}</p>
        <p><strong>Recebido por:</strong> ${nomeRecebedor}</p>
        <p><strong>Valor:</strong> R$ ${tx.valor.toFixed(2)}</p>
        <p><strong>Descrição:</strong> ${tx.descricao || "-"}</p>
        <p><strong>Data:</strong> ${dataFormatada}</p>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", cardHTML);
  });
}

function mostrarCardPix(pixData) {
  const container = document.getElementById('pixResultado');
  if (!container) return console.error(`[${new Date().toISOString()}] Elemento #pixResultado não encontrado`);

  container.innerHTML = '';
  const card = document.createElement('div');
  Object.assign(card.style, {
    border: '2px solid #ff6600',
    borderRadius: '8px',
    padding: '15px',
    marginTop: '20px',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    maxWidth: '400px',
  });

  card.innerHTML = `
    <h3 style="margin-bottom: 10px;">Resumo da Transação Pix</h3>
    <p><strong>Enviado por:</strong> ${pixData.deUsuario || 'Desconhecido'}</p>
    <p><strong>Recebido por:</strong> ${pixData.paraChave || 'Desconhecido'}</p>
    <p><strong>Valor:</strong> R$ ${pixData.valor?.toFixed(2) || '0,00'}</p>
    ${pixData.descricao ? `<p><strong>Descrição:</strong> ${pixData.descricao}</p>` : ''}
    <p><strong>Data:</strong> ${pixData.data ? new Date(pixData.data).toLocaleString() : ''}</p>
  `;
  container.appendChild(card);
}

document.addEventListener('DOMContentLoaded', () => {
  const byId = id => document.getElementById(id);
  byId('btnEnviar')?.addEventListener('click', enviarPix);
  byId('btnReceber')?.addEventListener('click', receberPix);
  byId('btnAgendarPix')?.addEventListener('click', agendarPix);
  byId('btnCobrarPix')?.addEventListener('click', cobrarPix);
  byId('btnLerQRCode')?.addEventListener('click', lerQRCode);
  byId('btnCopiarColar')?.addEventListener('click', pixCopiaCola);
  byId('btnMinhasChaves')?.addEventListener('click', verMinhasChaves);
  byId('btnCriarChaves')?.addEventListener('click', cadastrarChavePix);

  // Interceptador para capturar requisições GET indesejadas
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;
    if (url.includes('/api/pix/receber') && (!options || options.method === 'GET')) {
      console.warn(`[${new Date().toISOString()}] Requisição GET detectada para /api/pix/receber:`, args);
    }
    return originalFetch(...args);
  };
});