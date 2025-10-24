// frontend/pages/js/cards.js
export async function initCards() {
  // ================= Estado local =================
  let cartoes = { fisicos: [], virtuais: [] };

  // ================= Token e headers =================
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Token não encontrado no localStorage');
    alert('Por favor, faça login novamente.');
    return;
  }
  const headersAutenticados = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // ================= Elementos do DOM =================
  const btnCriarFisico = document.getElementById('btnCriarFisico');
  const btnCriarVirtual = document.getElementById('btnCriarVirtual');
  const btnPedirNovo = document.getElementById('btnPedirNovo');
  const btnVerCartoes = document.getElementById('btnVerCartoes');

  const secCriarFisico = document.getElementById('secCriarFisico');
  const secCriarVirtual = document.getElementById('secCriarVirtual');
  const secPedirNovo = document.getElementById('secPedirNovo');
  const secVerCartoes = document.getElementById('secVerCartoes');

  const formCriarVirtual = document.getElementById('formCriarVirtual');
  const formCriarFisico = document.getElementById('formCriarFisico');
  const formPedirNovo = document.getElementById('formPedirNovo');

  const cartaoVirtualContainer = document.getElementById('cartaoVirtualContainer');

  // ================= Funções Utilitárias =================
  function esconderTodasSecoes() {
    [secCriarFisico, secCriarVirtual, secPedirNovo, secVerCartoes, cartaoVirtualContainer]
      .forEach(el => { if (el) el.style.display = 'none'; });
  }

  function gerarNumeroCartao() {
    return Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join(' ');
  }

  function gerarCvv() {
    return Math.floor(100 + Math.random() * 900).toString();
  }

  async function copiarTexto(texto) {
    try { await navigator.clipboard.writeText(texto); alert('Copiado para a área de transferência!'); }
    catch { alert('Falha ao copiar. Tente manualmente.'); }
  }

  // ================= Navegação entre seções =================
  if (btnCriarFisico) btnCriarFisico.onclick = () => { esconderTodasSecoes(); secCriarFisico.style.display = 'block'; };
  if (btnCriarVirtual) btnCriarVirtual.onclick = () => { esconderTodasSecoes(); secCriarVirtual.style.display = 'block'; };
  if (btnPedirNovo) btnPedirNovo.onclick = () => { esconderTodasSecoes(); secPedirNovo.style.display = 'block'; };
  if (btnVerCartoes) btnVerCartoes.onclick = async () => { esconderTodasSecoes(); await atualizarListaCartoes(); secVerCartoes.style.display = 'block'; };

  // ================= Modal de Detalhes =================
  function ensureModalDetalhes() {
    let modal = document.getElementById('vbankModalDetalhes');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vbankModalDetalhes';
      modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;justify-content:center;align-items:center;padding:16px;';
      modal.innerHTML = `
        <div id="vbankModalContent" style="background:#1e1e1e;color:#fff;width:100%;max-width:420px;border-radius:12px;padding:20px;position:relative;">
          <button id="vbankModalClose" aria-label="Fechar" style="position:absolute;top:10px;right:12px;background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;">×</button>
          <h2 style="color:#ff6600;margin:0 0 16px;">Detalhes do Cartão</h2>
          <div style="background:linear-gradient(135deg,#FF6600,#cc5200);border-radius:15px;padding:20px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <img src="img/vb_bank.png" alt="VBank" style="height:30px;">
              <img src="img/mastercard.png" alt="MasterCard" style="height:30px;">
            </div>
            <div id="vbNumero" style="font-size:18px;letter-spacing:3px;margin-bottom:12px;">•••• •••• •••• ••••</div>
            <div style="display:flex;justify-content:space-between;font-size:14px;">
              <div id="vbTitular">NOME TITULAR</div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span>CVV:</span>
                <input id="vbCvv" type="password" value="•••" readonly style="width:56px;background:transparent;border:none;color:#fff;font-weight:bold;font-size:16px;letter-spacing:4px;">
                <button id="vbToggleCvv" type="button" style="background:none;border:none;color:#fff;cursor:pointer;">👁️</button>
                <button id="vbCopyCvv" type="button" style="background:none;border:none;color:#fff;cursor:pointer;">📋</button>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="vbCopyNumero" type="button" style="flex:1;background:#ff6600;border:none;color:#fff;border-radius:8px;padding:12px;cursor:pointer;">Copiar número</button>
            <button id="vbConcluir" type="button" style="flex:1;background:#ff6600;border:none;color:#fff;border-radius:8px;padding:12px;cursor:pointer;">Concluir</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const fechar = () => { modal.style.display = 'none'; };
      modal.querySelector('#vbankModalClose').addEventListener('click', fechar);
      modal.querySelector('#vbConcluir').addEventListener('click', fechar);
      modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.style.display === 'flex') fechar(); });
    }
    return modal;
  }

  function abrirDetalhesCartao(cartao) {
    const modal = ensureModalDetalhes();
    modal.querySelector('#vbNumero').textContent = cartao.numero;
    modal.querySelector('#vbTitular').textContent = cartao.nomeTitular;
    const cvvInput = modal.querySelector('#vbCvv');
    cvvInput.value = cartao.cvv;
    cvvInput.type = 'password';

    modal.querySelector('#vbCopyNumero').onclick = () => copiarTexto(cartao.numero);
    modal.querySelector('#vbCopyCvv').onclick = () => copiarTexto(cartao.cvv);
    modal.querySelector('#vbToggleCvv').onclick = () => {
      cvvInput.type = cvvInput.type === 'password' ? 'text' : 'password';
    };

    modal.style.display = 'flex';
  }

  // ================= Render do cartão virtual =================
  function renderCartaoVirtualVisual(cartao) {
    if (!cartaoVirtualContainer) return console.error('Elemento cartaoVirtualContainer não encontrado');
    cartaoVirtualContainer.innerHTML = `
      <div style="width:300px;height:180px;border-radius:15px;background:linear-gradient(135deg,#080808ff,#eaaa08ff);color:white;padding:20px;position:relative;margin-bottom:20px;">
        <img src="img/vb_bank.png" alt="VBank" style="height:40px;position:absolute;top:15px;left:20px;">
        <img src="img/mastercard.png" alt="MasterCard" style="height:40px;position:absolute;bottom:15px;right:20px;">
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <button id="btnVerDetalhes" style="flex:1;padding:10px;border:none;border-radius:8px;background:#ff6600;color:white;font-weight:bold;cursor:pointer;">Ver Detalhes</button>
        <button id="btnConcluirCartao" style="flex:1;padding:10px;border:none;border-radius:8px;background:#ff6600;color:white;font-weight:bold;cursor:pointer;">Concluir</button>
      </div>
    `;
    cartaoVirtualContainer.style.display = 'block';
    const btnDetalhes = document.getElementById('btnVerDetalhes');
    if (btnDetalhes) btnDetalhes.addEventListener('click', () => abrirDetalhesCartao(cartao));
    const btnConcluir = document.getElementById('btnConcluirCartao');
    if (btnConcluir) btnConcluir.addEventListener('click', () => { cartaoVirtualContainer.style.display = 'none'; });
  }

  // ================= Criar Cartão Virtual =================
  if (formCriarVirtual) {
    formCriarVirtual.addEventListener('submit', async e => {
      e.preventDefault();
      const numero = gerarNumeroCartao();
      const cvv = gerarCvv();
      const validade = '12/29';

      try {
        const res = await fetch('/api/cards/virtual', {
          method: 'POST',
          headers: headersAutenticados,
          body: JSON.stringify({ numero, cvv, validade }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar cartão virtual');
        const payload = data.card || data || {};
        const novoCartao = {
          _id: payload._id || payload.id,
          nomeTitular: payload.nomeTitular || 'Titular Não Informado',
          numero: payload.numero || numero,
          cvv: payload.cvv || cvv,
          validade: payload.validade || validade,
        };
        cartoes.virtuais.push(novoCartao);
        renderCartaoVirtualVisual(novoCartao);
        abrirDetalhesCartao(novoCartao);
        formCriarVirtual.reset();
        alert('Cartão virtual criado com sucesso!');
        await atualizarListaCartoes();
      } catch (error) {
        console.error('Erro em formCriarVirtual:', error);
        alert('Erro: ' + error.message);
      }
    });
  }

  // ================= Inicialização =================
  esconderTodasSecoes();
  await atualizarListaCartoes();

  // ================= Funções de Atualização e Exclusão =================
  async function atualizarListaCartoes() { /*... mantém todo o código existente ...*/ }
  async function excluirCartaoVirtual(id) { /*... mantém todo o código existente ...*/ }
  // E adicionar formCriarFisico, formPedirNovo etc da mesma forma
}

// ================= Inicializa automaticamente =================
document.addEventListener('DOMContentLoaded', () => initCards());
