const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  MODAL_ACTIONS: {
    transferMoney: 'Transferência',
    depositMoney: 'Depósito',
    withdrawMoney: 'Saque',
    payBill: 'Pagar Boleto',
    getLoan: 'Empréstimo',
    rechargePhone: 'Recarga de Celular',
    showQuotes: 'Cotações',
    investMoney: 'Investir',
    createVirtualCard: 'Criar Cartão Virtual',
    replacePhysicalCard: 'Substituir Cartão Físico',
    pixTransfer: 'Transferência Pix',
    pixPayment: 'Pagamento Pix',
    pixCharge: 'Cobrança Pix',
    pixSchedule: 'Agendar Pix',
    pixKeys: 'Registrar Chave Pix',
    pixMyKeys: 'Minhas Chaves Pix',
    financeProperty: 'Financiamento Imobiliário',
    financeVehicle: 'Financiamento de Veículo',
    financePersonal: 'Financiamento Pessoal',
  },
  REDIRECT_ACTIONS: {
    'create-account': '/create-account.html',
    login: '/login.html',
    'products-services': '/products-services.html',
    'recover-access': '/recover-access.html',
    'create-card': '/create-card.html',
  },
};

let state = {
  userFullName: 'Usuário',
  userAccountNumber: null,
  userId: null,
  balance: null,
  balanceVisible: false,
  currentAction: null,
};

const elements = {
  userName: document.getElementById('userName'),
  accountNumber: document.getElementById('accountNumber'),
  balance: document.getElementById('balance'),
  toggleBalance: document.getElementById('toggleBalance'),
  transactionHistory: document.getElementById('transactionHistory'),
  creditCardInvoice: document.getElementById('creditCardInvoice'),
  loans: document.getElementById('loans'),
  consignedLoans: document.getElementById('consignedLoans'),
  cardsList: document.getElementById('cardsList'),
  cardsContainer: document.getElementById('cardsContainer'),
  investmentBalance: document.getElementById('investmentBalance'),
  quotesResult: document.getElementById('quotesResult'),
  modalTitle: document.getElementById('exampleModalLabel'),
  modalBody: document.getElementById('modalBody'),
  modalConfirm: document.getElementById('modalConfirm'),
  actionModal: document.getElementById('exampleModal'),
  pixAreaModal: document.getElementById('pixAreaModal'),
  cardsAreaModal: document.getElementById('cardsAreaModal'),
  investmentsAreaModal: document.getElementById('investmentsAreaModal'),
  transactionsAreaModal: document.getElementById('transactionsAreaModal'),
  financingAreaModal: document.getElementById('financingAreaModal'),
  logoutBtn: document.getElementById('logoutBtn'),
};

const modals = {
  action: elements.actionModal,
  pixArea: elements.pixAreaModal,
  cardsArea: elements.cardsAreaModal,
  investmentsArea: elements.investmentsAreaModal,
  transactionsArea: elements.transactionsAreaModal,
  financingArea: elements.financingAreaModal,
};

const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token não encontrado');
  const response = await fetch(`${CONFIG.API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
  return response.json();
};

const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '2000';
  toast.style.padding = '1rem';
  toast.style.borderRadius = '8px';
  toast.style.maxWidth = '300px';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
};

const loadUserData = async () => {
  try {
    const data = await apiFetch('/user');
    state.userFullName = data.name || 'Usuário';
    state.userAccountNumber = data.accountNumber || '---';
    state.userId = data.userId || null;
    state.balance = data.balance || 0;
    elements.userName.textContent = `Bem-vindo, ${state.userFullName}!`;
    elements.accountNumber.textContent = state.userAccountNumber;
    elements.balance.textContent = state.balanceVisible ? `R$ ${state.balance.toFixed(2)}` : 'R$ ---';
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    throw error;
  }
};

const loadFinancialData = async () => {
  try {
    const data = await apiFetch('/financial');
    elements.creditCardInvoice.textContent = `R$ ${data.creditCardInvoice?.toFixed(2) || '---'}`;
    elements.investmentBalance.textContent = `R$ ${data.investmentBalance?.toFixed(2) || '---'}`;
    elements.loans.textContent = data.loans || 'Nenhum';
    elements.consignedLoans.textContent = data.consignedLoans || 'Nenhum';
  } catch (error) {
    console.error('Erro ao carregar dados financeiros:', error);
    throw error;
  }
};

const showQuotes = async () => {
  try {
    const data = await apiFetch('/quotes');
    elements.quotesResult.innerHTML = DOMPurify.sanitize(`
      <p>Dólar: R$ ${data.dollar?.toFixed(2) || '---'}</p>
      <p>Euro: R$ ${data.euro?.toFixed(2) || '---'}</p>
    `);
  } catch (error) {
    console.error('Erro ao carregar cotações:', error);
    throw error;
  }
};

const loadVirtualCards = async (id = null) => {
  try {
    const data = id ? await apiFetch(`/virtualCards/${id}`) : await apiFetch('/virtualCards');
    const cards = id ? [data.card] : data;
    elements.cardsContainer.innerHTML = DOMPurify.sanitize(
      cards.map(card => `
        <div class="card-virtual" style="border: 1px solid var(--color3); padding: 8px; border-radius: 4px;">
          <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin: auto; object-fit: contain;">
          <div class="card-virtual__number">${sanitizeHTML(card.number)}</div>
          <div class="card-virtual__info">
            <p>Nome: ${sanitizeHTML(card.name)}</p>
            <p>Validade: ${sanitizeHTML(card.expiry)}</p>
          </div>
          <button class="card-virtual__delete-btn btn btn-danger" data-id="${sanitizeHTML(card._id)}">Excluir</button>
          <button class="card-virtual__details-btn btn btn-primary" data-id="${sanitizeHTML(card._id)}">Detalhes</button>
        </div>
      `).join('')
    );
  } catch (error) {
    console.error('Erro ao carregar cartões virtuais:', error);
    throw error;
  }
};

const loadHistory = async () => {
  try {
    const data = await apiFetch('/transactions');
    elements.transactionHistory.innerHTML = DOMPurify.sanitize(
      data.transactions?.length
        ? data.transactions.map(t => `
            <p>Transação: R$ ${t.amount?.toFixed(2) || '---'} - ${new Date(t.createdAt).toLocaleString('pt-BR')}</p>
          `).join('')
        : '<p class="text-muted">Nenhum histórico encontrado</p>'
    );
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    throw error;
  }
};

const loadAllCards = async () => {
  await loadVirtualCards();
};

const getModalContent = (action) => {
  const forms = {
    transferMoney: `
      <form id="transferForm">
        <label for="transferAccountNumber">Conta Destino:</label>
        <input type="text" id="transferAccountNumber" required>
        <label for="transferAmount">Valor:</label>
        <input type="number" id="transferAmount" step="0.01" required>
      </form>
    `,
    depositMoney: `
      <form id="depositForm">
        <label for="depositAccountNumber">Conta Destino:</label>
        <input type="text" id="depositAccountNumber" required>
        <label for="depositAmount">Valor:</label>
        <input type="number" id="depositAmount" step="0.01" required>
      </form>
    `,
    withdrawMoney: `
      <form id="withdrawForm">
        <label for="withdrawAmount">Valor:</label>
        <input type="number" id="withdrawAmount" step="0.01" required>
      </form>
    `,
    payBill: `
      <form id="payBillForm">
        <label for="barcode">Código de Barras:</label>
        <input type="text" id="barcode" required>
      </form>
    `,
    getLoan: `
      <form id="loanForm">
        <label for="loanAmount">Valor do Empréstimo:</label>
        <input type="number" id="loanAmount" step="0.01" required>
        <label for="installments">Parcelas:</label>
        <input type="number" id="installments" required>
      </form>
    `,
    rechargePhone: `
      <form id="rechargeForm">
        <label for="operator">Operadora:</label>
        <input type="text" id="operator" required>
        <label for="amount">Valor:</label>
        <input type="number" id="amount" step="0.01" required>
        <label for="phone">Telefone:</label>
        <input type="text" id="phone" required>
      </form>
    `,
    investMoney: `
      <form id="investForm">
        <label for="investmentType">Tipo de Investimento:</label>
        <select id="investmentType" required>
          <option value="fixed_income">Renda Fixa</option>
          <option value="stocks">Ações</option>
          <option value="funds">Fundos</option>
          <option value="crypto">Cripto</option>
        </select>
        <label for="amount">Valor:</label>
        <input type="number" id="amount" step="0.01" required>
        <label for="returnRate">Taxa de Retorno (%):</label>
        <input type="number" id="returnRate" step="0.01" required>
        <label for="installments">Parcelas:</label>
        <input type="number" id="installments" required>
      </form>
    `,
    replacePhysicalCard: `
      <form id="replaceCardForm">
        <label for="reason">Motivo:</label>
        <input type="text" id="reason" required>
      </form>
    `,
    pixTransfer: `
      <form id="pixTransferForm">
        <label for="pixKey">Chave Pix:</label>
        <input type="text" id="pixKey" required>
        <label for="pixAmount">Valor:</label>
        <input type="number" id="pixAmount" step="0.01" required>
      </form>
    `,
    pixPayment: `
      <form id="pixPaymentForm">
        <label for="pixKey">Chave Pix:</label>
        <input type="text" id="pixKey" required>
        <label for="pixAmount">Valor:</label>
        <input type="number" id="pixAmount" step="0.01" required>
      </form>
    `,
    pixCharge: `
      <form id="pixChargeForm">
        <label for="chargeAmount">Valor a Cobrar:</label>
        <input type="number" id="chargeAmount" step="0.01" required>
      </form>
    `,
    pixSchedule: `
      <form id="pixScheduleForm">
        <label for="pixKey">Chave Pix:</label>
        <input type="text" id="pixKey" required>
        <label for="scheduleAmount">Valor:</label>
        <input type="number" id="scheduleAmount" step="0.01" required>
        <label for="scheduleDate">Data:</label>
        <input type="date" id="scheduleDate" required>
      </form>
    `,
    pixKeys: `
      <form id="pixKeysForm">
        <label for="keyType">Tipo de Chave:</label>
        <select id="keyType" required>
          <option value="cpf">CPF</option>
          <option value="email">E-mail</option>
          <option value="phone">Telefone</option>
        </select>
        <label for="keyValue">Valor da Chave:</label>
        <input type="text" id="keyValue" required>
      </form>
    `,
    pixMyKeys: `
      <div id="pixKeysResult"><p>Carregando...</p></div>
    `,
    showQuotes: `
      <div id="quotesResult"><p>Carregando cotações...</p></div>
    `,
  };
  return forms[action] || '<p>Funcionalidade em desenvolvimento.</p>';
};

const validateForm = (form) => {
  if (!form || !form.checkValidity()) throw new Error('Formulário inválido');
};

const validateString = (value, field) => {
  if (!value || typeof value !== 'string' || value.trim() === '') throw new Error(`${field} é obrigatório`);
  return value.trim();
};

const validateNumber = (value, field) => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) throw new Error(`${field} deve ser um número positivo`);
  return num;
};

const validatePhone = (value, field) => {
  const phoneRegex = /^\(\d{2}\)\s9\d{4}-\d{4}$/;
  if (!phoneRegex.test(value)) throw new Error(`${field} deve estar no formato (XX) 9XXXX-XXXX`);
  return value;
};

const validatePixKey = (value) => {
  const pixKeyRegex = /^(?:\d{11}|\d{8}|\S+@\S+\.\S+|(?:\(\d{2}\)\s9\d{4}-\d{4}))$/;
  if (!pixKeyRegex.test(value)) throw new Error('Chave Pix inválida');
  return value;
};

const generateCardNumberLastFour = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateCVV = () => {
  return Math.floor(100 + Math.random() * 900).toString();
};

const generateFullCardNumber = (lastFour) => {
  return `**** **** **** ${lastFour}`;
};

const setupCardDisplay = ({ container, number, lastFour, expiry, cvv, fullName }) => {
  container.innerHTML = DOMPurify.sanitize(`
    <div class="card-virtual" style="border: 1px solid var(--color3); padding: 8px; border-radius: 4px;">
      <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin: auto; object-fit: contain;">
      <div class="card-virtual__number">${sanitizeHTML(number)}</div>
      <div class="card-virtual__info">
        <p>Nome: ${sanitizeHTML(fullName)}</p>
        <p>Validade: ${sanitizeHTML(expiry)}</p>
        <p>CVV: ${sanitizeHTML(cvv)}</p>
      </div>
    </div>
  `);
};

const getFinancingData = (action) => {
  const form = document.getElementById(`${action}Form`);
  validateForm(form);
  const amount = validateNumber(document.getElementById('financeAmount').value, 'Valor');
  const term = parseInt(document.getElementById('installments').value);
  if (isNaN(term) || term <= 0) throw new Error('Número de parcelas é obrigatório');
  return { amount, term, type: action };
};

const sanitizeHTML = (str) => {
  return DOMPurify.sanitize(str);
};

const openModal = (modal, action, content) => {
  console.log(`Tentando abrir modal: ${modal?.id || 'null'} para ação: ${action}`);
  if (!modal) {
    console.error(`Modal para ação ${action} não encontrado`);
    showToast(`Erro: Modal para ${CONFIG.MODAL_ACTIONS[action] || action} não está disponível`, 'danger');
    return;
  }
  Object.values(modals).forEach(m => {
    if (m !== modal && m?.classList.contains('show')) {
      console.log(`Fechando modal: ${m.id}`);
      m.classList.remove('show');
    }
  });
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  if (modalTitle) {
    modalTitle.textContent = CONFIG.MODAL_ACTIONS[action] || action;
  } else {
    console.warn(`Título do modal ${modal.id} não encontrado`);
  }
  if (modalBody) {
    modalBody.innerHTML = content || '<p>Carregando...</p>';
  } else {
    console.warn(`Corpo do modal ${modal.id} não encontrado`);
  }
  modal.classList.add('show');
  console.log(`Modal ${modal.id} exibido`);
  const firstFocusable = modal.querySelector('input, select, button:not([disabled])');
  if (firstFocusable) {
    setTimeout(() => firstFocusable.focus(), 100);
    console.log(`Foco definido em: ${firstFocusable.tagName}#${firstFocusable.id || firstFocusable.className}`);
  } else {
    console.warn(`Nenhum elemento focável encontrado no modal ${modal.id}`);
    modal.focus();
  }
};

const closeModal = (modal) => {
  if (modal && modal.classList.contains('show')) {
    console.log(`Fechando modal: ${modal.id}`);
    modal.classList.remove('show');
    const focusTarget = document.getElementById('userName') || document.body;
    focusTarget.focus();
  }
};

const handleAction = async (action) => {
  console.log(`Iniciando handleAction para: ${action}`);
  try {
    state.currentAction = action;
    const modalMapping = {
      viewVirtualCards: modals.cardsArea,
      pixTransfer: modals.pixArea,
      pixPayment: modals.pixArea,
      pixCharge: modals.pixArea,
      pixSchedule: modals.pixArea,
      pixKeys: modals.pixArea,
      pixMyKeys: modals.pixArea,
      financeProperty: modals.financingArea,
      financeVehicle: modals.financingArea,
      financePersonal: modals.financingArea,
      investMoney: modals.investmentsArea,
      transactionsArea: modals.transactionsArea,
    };
    const modal = modalMapping[action] || modals.action;
    if (!modal) {
      console.error(`Modal não encontrado para ação: ${action}`);
      showToast(`Modal para ${CONFIG.MODAL_ACTIONS[action] || action} não está disponível`, 'danger');
      return;
    }
    if (action === 'viewVirtualCards') {
      openModal(modal, action, '<p>Carregando cartões...</p>');
      await loadVirtualCards();
      return;
    }
    if (action === 'showQuotes') {
      openModal(modal, action, getModalContent(action));
      await showQuotes();
      return;
    }
    if (action === 'pixMyKeys') {
      openModal(modal, action, getModalContent(action));
      const pixKeysResult = document.getElementById('pixKeysResult');
      if (!pixKeysResult) throw new Error('Elemento pixKeysResult não encontrado');
      pixKeysResult.innerHTML = '<p>Carregando...</p>';
      const data = await apiFetch('/pix/myKeys');
      pixKeysResult.innerHTML = data.keys?.length
        ? data.keys.map(key => `
            <div class="card-virtual mb-3" style="border: 1px solid var(--color3); max-width: 350px; height:200px; padding: 8px; font-size: 13px; border-radius: 4px; background-color: #fff; box-sizing: border-box; margin: 0 auto 0.75rem auto;">
              <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin:auto;margin-top:-15px; object-fit: contain;">
              <div class="card-virtual__number" style="font-size: 20px; font-weight: 900; margin-bottom:-95px;color: #fff;">${sanitizeHTML(key.value)}</div>
              <div class="card-virtual__info" style="font-size: 13px; margin-bottom:-75px;"><p style="margin: 0; line-height: 1.3;">Tipo: ${sanitizeHTML(key.type)}</p></div>
              <small class="text-muted" style="font-size: 11px; color: #6c757d; display: block;">Criada em: ${new Date(key.createdAt).toLocaleString('pt-BR')}</small>
              <button class="card-virtual__delete-btn btn btn-danger mt-2" style="font-size: 13px; padding: 3px 6px; line-height: 1.2;" data-id="${sanitizeHTML(key._id)}" aria-label="Excluir chave Pix"><i class="fas fa-trash"></i></button>
            </div>
          `).join('')
        : '<p class="text-muted text-center">Nenhuma chave Pix encontrada</p>';
      pixKeysResult.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.card-virtual__delete-btn');
        if (deleteBtn && confirm('Deseja excluir esta chave Pix?')) {
          try {
            await apiFetch(`/pix/keys/${deleteBtn.dataset.id}`, { method: 'DELETE' });
            showToast('Chave Pix excluída com sucesso!', 'success');
            await handleAction('pixMyKeys');
          } catch (error) {
            showToast(`Erro ao excluir chave Pix: ${error.message}`, 'danger');
          }
        }
      }, { once: true });
      return;
    }
    if (action === 'createVirtualCard') {
      openModal(modal, action, getModalContent(action));
      if (!elements.modalConfirm) throw new Error('Botão de confirmação não encontrado');
      elements.modalConfirm.onclick = async () => {
        if (!state.userId) {
          await loadUserData();
          if (!state.userId) throw new Error('ID do usuário não encontrado');
        }
        elements.modalBody.innerHTML = `
          <div class="p-4 bg-dark rounded text-center">
            <div class="mb-3"><i class="fas fa-spinner fa-spin fa-3x text-primary" aria-hidden="true"></i></div>
            <h5 class="mb-3">Processando...</h5>
            <p>Estamos criando seu cartão virtual.</p>
          </div>
        `;
        elements.modalConfirm.disabled = true;
        elements.modalConfirm.textContent = 'Processando...';
        try {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 2);
          const expiry = `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${String(expiryDate.getFullYear()).slice(-2)}`;
          const lastFour = generateCardNumberLastFour();
          const cvv = generateCVV();
          const cardData = {
            userId: state.userId,
            limit: 500,
            type: 'multi-use',
            brand: 'Mastercard',
            fullName: state.userFullName,
            cvv,
            number: generateFullCardNumber(lastFour),
            lastFour,
            expiry,
            status: 'active',
          };
          const responseData = await apiFetch('/virtualCards', {
            method: 'POST',
            body: JSON.stringify(cardData),
          });
          elements.modalBody.innerHTML = '';
          setupCardDisplay({
            container: elements.modalBody,
            number: responseData.card.number,
            lastFour: responseData.card.lastFour,
            expiry: responseData.card.expiry,
            cvv: responseData.card.cvv,
            fullName: responseData.card.fullName,
          });
          elements.modalConfirm.disabled = false;
          elements.modalConfirm.textContent = 'Concluir';
          elements.modalConfirm.onclick = () => {
            closeModal(modals.action);
            openModal(modals.cardsArea, 'viewVirtualCards', '<p>Carregando cartões...</p>');
            loadVirtualCards(responseData.card._id);
          };
        } catch (error) {
          elements.modalBody.innerHTML = `
            <div class="p-4 bg-dark rounded text-center">
              <div class="mb-3"><i class="fas fa-exclamation-circle fa-3x text-danger" aria-hidden="true"></i></div>
              <h5 class="mb-3">Erro</h5>
              <p>${sanitizeHTML(error.message)}</p>
            </div>
          `;
          elements.modalConfirm.disabled = false;
          elements.modalConfirm.textContent = 'Tentar novamente';
          elements.modalConfirm.onclick = () => handleAction('createVirtualCard');
          showToast(`Erro: ${error.message}`, 'danger');
        }
      };
      return;
    }
    const actions = {
      transferMoney: () => {
        const form = document.getElementById('transferForm');
        validateForm(form);
        const accountNumber = validateString(document.getElementById('transferAccountNumber').value, 'Conta destino');
        const amount = validateNumber(document.getElementById('transferAmount').value, 'Valor');
        return { url: '/transactions/transfer', body: { accountNumber, amount }, modal: modals.action, form };
      },
      depositMoney: () => {
        const form = document.getElementById('depositForm');
        validateForm(form);
        const accountNumber = validateString(document.getElementById('depositAccountNumber').value, 'Conta destino');
        const amount = validateNumber(document.getElementById('depositAmount').value, 'Valor');
        return { url: '/transactions/deposit', body: { accountNumber, amount }, modal: modals.action, form };
      },
      withdrawMoney: () => {
        const form = document.getElementById('withdrawForm');
        validateForm(form);
        const amount = validateNumber(document.getElementById('withdrawAmount').value, 'Valor');
        return { url: '/transactions/withdraw', body: { amount }, modal: modals.action, form };
      },
      payBill: () => {
        const form = document.getElementById('payBillForm');
        validateForm(form);
        const barcode = validateString(document.getElementById('barcode').value, 'Código de barras');
        return { url: '/transactions/pay-bill', body: { barcode }, modal: modals.action, form };
      },
      getLoan: () => {
        const form = document.getElementById('loanForm');
        validateForm(form);
        const amount = validateNumber(document.getElementById('loanAmount').value, 'Valor do empréstimo');
        const term = parseInt(document.getElementById('installments').value);
        if (isNaN(term) || term <= 0) throw new Error('Número de parcelas é obrigatório');
        return { url: '/loans/request', body: { amount, term, type: 'consigned' }, modal: modals.action, form };
      },
      rechargePhone: () => {
        const form = document.getElementById('rechargeForm');
        validateForm(form);
        const operator = validateString(document.getElementById('operator').value, 'Operadora');
        const amount = validateNumber(document.getElementById('amount').value, 'Valor');
        const phone = validatePhone(document.getElementById('phone').value, 'Telefone');
        return { url: '/transactions/recharge', body: { operator, amount, phone }, modal: modals.action, form };
      },
      investMoney: () => {
        const form = document.getElementById('investForm');
        validateForm(form);
        const type = validateString(document.getElementById('investmentType').value, 'Tipo de investimento');
        const amount = validateNumber(document.getElementById('amount').value, 'Valor');
        const returnRate = validateNumber(document.getElementById('returnRate').value, 'Taxa de retorno') / 100;
        const installments = parseInt(document.getElementById('installments').value);
        if (!['fixed_income', 'stocks', 'funds', 'crypto'].includes(type)) throw new Error('Tipo de investimento inválido');
        if (returnRate < 0 || returnRate > 1) throw new Error('Taxa de retorno deve estar entre 0% e 100%');
        if (isNaN(installments) || installments <= 0) throw new Error('Número de parcelas é obrigatório');
        const monthlyRate = returnRate;
        const installmentAmount = (amount * monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1);
        return { url: '/investments', body: { userId: state.userId, type, amount, returnRate, installments, installmentAmount }, modal: modals.investmentsArea, form };
      },
      replacePhysicalCard: () => {
        const form = document.getElementById('replaceCardForm');
        validateForm(form);
        const reason = validateString(document.getElementById('reason').value, 'Motivo da solicitação');
        return { url: '/cards/replace', body: { reason }, modal: modals.action, form };
      },
      pixTransfer: () => {
        const form = document.getElementById('pixTransferForm');
        validateForm(form);
        const pixKey = validatePixKey(validateString(document.getElementById('pixKey').value, 'Chave Pix'));
        const amount = validateNumber(document.getElementById('pixAmount').value, 'Valor');
        return { url: '/pix/transfer', body: { pixKey, amount }, modal: modals.pixArea, form };
      },
      pixPayment: () => {
        const form = document.getElementById('pixPaymentForm');
        validateForm(form);
        const pixKey = validatePixKey(validateString(document.getElementById('pixKey').value, 'Chave Pix'));
        const amount = validateNumber(document.getElementById('pixAmount').value, 'Valor');
        return { url: '/pix/pay', body: { pixKey, amount }, modal: modals.pixArea, form };
      },
      pixCharge: () => {
        const form = document.getElementById('pixChargeForm');
        validateForm(form);
        const amount = validateNumber(document.getElementById('chargeAmount').value, 'Valor a cobrar');
        return { url: '/pix/charge', body: { amount }, modal: modals.pixArea, form };
      },
      pixSchedule: () => {
        const form = document.getElementById('pixScheduleForm');
        validateForm(form);
        const pixKey = validatePixKey(validateString(document.getElementById('pixKey').value, 'Chave Pix'));
        const amount = validateNumber(document.getElementById('scheduleAmount').value, 'Valor');
        const date = validateString(document.getElementById('scheduleDate').value, 'Data');
        const scheduleDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(scheduleDate.getTime()) || scheduleDate < today) throw new Error('Data inválida ou anterior ao dia atual');
        return { url: '/pix/schedule', body: { pixKey, amount, date }, modal: modals.pixArea, form };
      },
      pixKeys: () => {
        const form = document.getElementById('pixKeysForm');
        validateForm(form);
        const type = validateString(document.getElementById('keyType').value, 'Tipo de chave');
        const value = validatePixKey(validateString(document.getElementById('keyValue').value, 'Valor da chave'));
        return { url: '/pix/registerKey', body: { type, value }, modal: modals.pixArea, form };
      },
      financeProperty: () => {
        const form = document.getElementById('financePropertyForm');
        validateForm(form);
        return { url: '/loans/request', body: getFinancingData(action), modal: modals.financingArea, form };
      },
      financeVehicle: () => {
        const form = document.getElementById('financeVehicleForm');
        validateForm(form);
        return { url: '/loans/request', body: getFinancingData(action), modal: modals.financingArea, form };
      },
      financePersonal: () => {
        const form = document.getElementById('financePersonalForm');
        validateForm(form);
        return { url: '/loans/request', body: getFinancingData(action), modal: modals.financingArea, form };
      },
    };
    if (actions[action]) {
      openModal(modal, action, getModalContent(action));
      const { url, body, modal: actionModal, form } = actions[action]();
      if (actionModal === modals.action && elements.modalConfirm) {
        elements.modalConfirm.onclick = async () => {
          elements.modalBody.innerHTML = `
            <div class="p-4 bg-dark rounded text-center">
              <div class="mb-3"><i class="fas fa-spinner fa-spin fa-3x text-primary" aria-hidden="true"></i></div>
              <h5 class="mb-3">Processando...</h5>
              <p>Estamos processando sua solicitação.</p>
            </div>
          `;
          elements.modalConfirm.disabled = true;
          elements.modalConfirm.textContent = 'Processando...';
          try {
            const responseData = await apiFetch(url, {
              method: 'POST',
              body: JSON.stringify(body),
            });
            elements.modalBody.innerHTML = `
              <div class="p-4 bg-dark rounded text-center">
                <div class="mb-3"><i class="fas fa-check-circle fa-3x text-success" aria-hidden="true"></i></div>
                <h5 class="mb-3">Sucesso</h5>
                <p>${sanitizeHTML(CONFIG.MODAL_ACTIONS[action] || action)} realizada com sucesso!</p>
                ${
                  action === 'pixKeys' ? `
                    <div class="card-virtual mt-3" style="border: 1px solid var(--color3);">
                      <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin:auto;margin-top:-15px; object-fit: contain;">
                      <div class="card-virtual__number">${sanitizeHTML(responseData.pixKey?.value || 'N/A')}</div>
                      <div class="card-virtual__info"><p>Tipo: ${sanitizeHTML(responseData.pixKey?.type || 'N/A')}</p></div>
                      <small class="text-muted">Criada em: ${new Date(responseData.pixKey?.createdAt || Date.now()).toLocaleString('pt-BR')}</small>
                    </div>
                  ` : action === 'pixSchedule' ? `
                    <div class="card-virtual mt-3" style="border: 1px solid var(--color3);">
                      <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin:auto;margin-top:-15px; object-fit: contain;">
                      <div class="card-virtual__number">${sanitizeHTML(responseData.transaction?.pixKey || 'N/A')}</div>
                      <div class="card-virtual__info">
                        <p>Valor: R$ ${responseData.transaction?.amount?.toFixed(2) || '0.00'}</p>
                        <p>Data: ${new Date(responseData.transaction?.date || Date.now()).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ` : action === 'pixPayment' ? `
                    <div class="card-virtual mt-3" style="border: 1px solid var(--color3);">
                      <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin:auto;margin-top:-15px; object-fit: contain;">
                      <div class="card-virtual__number">${sanitizeHTML(responseData.transaction?.pixKey || 'N/A')}</div>
                      <div class="card-virtual__info">
                        <p>Valor: R$ ${responseData.transaction?.amount?.toFixed(2) || '0.00'}</p>
                        <p>Data: ${new Date(responseData.transaction?.createdAt || Date.now()).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ` : action === 'pixTransfer' ? `
                    <div class="card-virtual mt-3" style="border: 1px solid var(--color3);">
                      <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin:auto;margin-top:-15px; object-fit: contain;">
                      <div class="card-virtual__number">${sanitizeHTML(responseData.transaction?.pixKey || 'N/A')}</div>
                      <div class="card-virtual__info">
                        <p>Valor: R$ ${responseData.transaction?.amount?.toFixed(2) || '0.00'}</p>
                        <p>Data: ${new Date(responseData.transaction?.createdAt || Date.now()).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ` : action === 'pixCharge' ? `
                    <div class="card-virtual mt-3" style="border: 1px solid var(--color3);">
                      <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin:auto;margin-top:-15px; object-fit: contain;">
                      <div class="card-virtual__number">Cobrança Pix</div>
                      <div class="card-virtual__info">
                        <p>Valor: R$ ${responseData.transaction?.amount?.toFixed(2) || '0.00'}</p>
                        <p>Data: ${new Date(responseData.transaction?.createdAt || Date.now()).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ` : action === 'investMoney' ? `
                    <div class="card-virtual mt-3" style="border: 1px solid var(--color3);">
                      <img src="/img/vb_bank.png" alt="VBank Logo" style="height: 80px; width: auto; display: block; margin:auto;margin-top:-15px; object-fit: contain;">
                      <div class="card-virtual__number">${sanitizeHTML(responseData.investment?.type || 'N/A')}</div>
                      <div class="card-virtual__info">
                        <p>Valor: R$ ${responseData.investment?.amount?.toFixed(2) || '0.00'}</p>
                        <p>Taxa de Retorno: ${(responseData.investment?.returnRate * 100 || 0).toFixed(2)}%</p>
                        <small class="text-muted">Criado em: ${new Date(responseData.investment?.createdAt || Date.now()).toLocaleString('pt-BR')}</small>
                      </div>
                    </div>
                  ` : ''
                }
              </div>
            `;
            elements.modalConfirm.disabled = false;
            elements.modalConfirm.textContent = 'Concluir';
            showToast(`${CONFIG.MODAL_ACTIONS[action] || action} realizada com sucesso!`, 'success');
            form?.reset();
            if (['transferMoney', 'depositMoney', 'withdrawMoney', 'payBill', 'rechargePhone', 'pixTransfer', 'pixPayment', 'pixCharge', 'pixSchedule'].includes(action)) {
              await Promise.all([loadUserData(), loadHistory()]);
            }
            if (['getLoan', 'financeProperty', 'financeVehicle', 'financePersonal', 'investMoney'].includes(action)) {
              await loadFinancialData();
            }
            if (['replacePhysicalCard'].includes(action)) {
              await loadAllCards();
            }
            if (['pixKeys'].includes(action)) {
              await handleAction('pixMyKeys');
            }
            elements.modalConfirm.onclick = () => {
              closeModal(actionModal);
              elements.modalBody.innerHTML = '';
              elements.modalConfirm.onclick = null;
            };
          } catch (error) {
            elements.modalBody.innerHTML = `
              <div class="p-4 bg-dark rounded text-center">
                <div class="mb-3"><i class="fas fa-exclamation-circle fa-3x text-danger" aria-hidden="true"></i></div>
                <h5 class="mb-3">Erro</h5>
                <p>${sanitizeHTML(error.message)}</p>
              </div>
            `;
            elements.modalConfirm.disabled = false;
            elements.modalConfirm.textContent = 'Tentar novamente';
            elements.modalConfirm.onclick = () => handleAction(action);
            showToast(`Erro: ${error.message}`, 'danger');
          }
        };
      } else {
        openModal(modal, action, getModalContent(action));
      }
    } else {
      showToast(`Funcionalidade ${action} em desenvolvimento`, 'warning');
    }
  } catch (error) {
    console.error(`Erro em handleAction (${action}):`, error);
    showToast(`Erro: ${error.message}`, 'danger');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando dashboard.js...');
  const preload = document.getElementById('preload');
  if (preload) {
    console.log('Removendo #preload');
    preload.classList.add('hidden');
  }
  Object.keys(elements).forEach(key => {
    if (!elements[key]) console.warn(`Elemento #${key} não encontrado no DOM`);
  });
  Object.keys(modals).forEach(key => {
    if (!modals[key]) console.warn(`Modal ${key} não encontrado (ID: ${elements[`${key}Modal`]?.id})`);
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) closeModal(modal);
    });
  });
  const modalActionSelectors = {
    pixArea: { selector: '.pix-icon-item', attr: 'data-pix-action' },
    cardsArea: { selector: '.cards-icon-item', attr: 'data-cards-action' },
    investmentsArea: { selector: '.investments-icon-item', attr: 'data-investments-action' },
    transactionsArea: { selector: '.transactions-icon-item', attr: 'data-transactions-action' },
    financingArea: { selector: '.financing-icon-item', attr: 'data-financing-action' },
  };
  Object.entries(modalActionSelectors).forEach(([modalKey, { selector, attr }]) => {
    const modal = modals[modalKey];
    if (modal) {
      modal.querySelectorAll(selector).forEach(item => {
        item.addEventListener('click', () => {
          const action = item.getAttribute(attr);
          console.log(`Ação disparada: ${action} no modal ${modalKey}`);
          handleAction(action);
        });
      });
    }
  });
  if (elements.cardsArea) {
    elements.cardsArea.addEventListener('click', () => handleAction('viewVirtualCards'));
  }
  if (elements.investmentsArea) {
    elements.investmentsArea.addEventListener('click', () => openModal(modals.investmentsArea, 'investmentsArea', '<p>Carregando área de investimentos...</p>'));
  }
  if (elements.financingArea) {
    elements.financingArea.addEventListener('click', () => openModal(modals.financingArea, 'financingArea', '<p>Carregando área de financiamentos...</p>'));
  }
  if (elements.transactionsArea) {
    elements.transactionsArea.addEventListener('click', () => openModal(modals.transactionsArea, 'transactionsArea', '<p>Carregando área de transações...</p>'));
  }
  if (elements.pixArea) {
    elements.pixArea.addEventListener('click', () => openModal(modals.pixArea, 'pixArea', '<p>Carregando área Pix...</p>'));
  }
  if (elements.showQuotes) {
    elements.showQuotes.addEventListener('click', () => handleAction('showQuotes'));
  }
  if (modals.cardsArea) {
    modals.cardsArea.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.card-virtual__delete-btn');
      const detailsBtn = e.target.closest('.card-virtual__details-btn');
      if (deleteBtn && confirm('Deseja excluir este cartão virtual?')) {
        try {
          await apiFetch(`/virtualCards/${deleteBtn.dataset.id}`, { method: 'DELETE' });
          showToast('Cartão virtual excluído com sucesso!', 'success');
          await loadVirtualCards();
        } catch (error) {
          showToast(`Erro ao excluir cartão: ${error.message}`, 'danger');
        }
      }
      if (detailsBtn) {
        await loadVirtualCards(detailsBtn.dataset.id);
      }
    });
  }
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }
  if (elements.toggleBalance) {
    elements.toggleBalance.addEventListener('click', () => {
      state.balanceVisible = !state.balanceVisible;
      elements.balance.textContent = state.balanceVisible ? `R$ ${state.balance?.toFixed(2) || '---'}` : 'R$ ---';
      elements.toggleBalance.className = `fas fa-${state.balanceVisible ? 'eye-slash' : 'eye'}`;
    });
  }
  const initialize = async () => {
    console.log('Verificando token...');
    if (!localStorage.getItem('token')) {
      console.log('Token não encontrado, redirecionando para login');
      window.location.href = '/login.html';
      return;
    }
    try {
      await Promise.all([loadUserData(), loadFinancialData(), showQuotes()]);
      console.log('Dashboard inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      showToast(`Erro ao inicializar: ${error.message}`, 'danger');
    }
  };
  initialize();
});