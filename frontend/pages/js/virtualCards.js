// virtualCards.js

// Função para sanitizar HTML (evitar XSS)
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Função para mostrar mensagens rápidas (toast)
function showToast(message, type = 'info') {
  // Implementação simples ou usar biblioteca
  alert(`${type.toUpperCase()}: ${message}`);
}

// Função para carregar os cartões virtuais
async function loadVirtualCards(showDetailsId) {
  try {
    // Aqui você faz a chamada API para buscar os cartões
    const cards = await apiFetch('/api/virtualCards'); // Ajuste conforme sua API

    // Inicializa container com os cartões
    elements.cardsContainer.innerHTML = `
      <div id="cardsListView" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        ${
          cards.length
            ? cards
                .map(
                  (card) => `
                  <div class="col">
                    <div class="card-virtual-container h-100">
                      <div class="card-virtual position-relative p-3 border rounded shadow-sm bg-dark text-white">
                        <img src="/img/vbank.png" alt="VBank Logo" class="card-virtual__vbank-logo img-fluid" style="max-width: 100px;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="Mastercard Logo" class="card-virtual__mastercard-logo img-fluid" style="max-width: 50px; position: absolute; top: 10px; right: 10px;">
                        <span class="card-virtual__chip d-block my-2" style="width: 40px; height: 25px; background: gold; border-radius: 5px;"></span>
                        <button class="card-virtual__delete-btn btn btn-sm btn-danger position-absolute top-0 start-0 m-2" data-id="${sanitizeHTML(card._id)}" title="Excluir Cartão"><i class="fas fa-trash"></i></button>
                        <button class="card-virtual__details-btn btn btn-sm btn-outline-primary w-100 mt-2" data-id="${sanitizeHTML(card._id)}">Ver Detalhes</button>
                        <div>**** **** **** ${sanitizeHTML(card.lastFour || '****')}</div>
                      </div>
                    </div>
                  </div>
                `
                )
                .join('')
            : '<p class="text-muted text-center col-12">Nenhum cartão virtual encontrado.</p>'
        }
      </div>
      <div id="cardDetailsView" class="d-none"></div>
    `;

    const cardsListView = elements.cardsContainer.querySelector('#cardsListView');
    const cardDetailsView = elements.cardsContainer.querySelector('#cardDetailsView');

    // Delegação para botões dentro do container
    elements.cardsContainer.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.card-virtual__delete-btn');
      const detailsBtn = e.target.closest('.card-virtual__details-btn');
      if (deleteBtn && confirm('Deseja excluir este cartão virtual?')) {
        await deleteVirtualCard(deleteBtn.dataset.id);
        loadVirtualCards(); // Recarrega lista após exclusão
      }
      if (detailsBtn) {
        await showCardDetails(detailsBtn.dataset.id);
      }
    });

    // Mostrar detalhes direto se tiver id
    if (showDetailsId) {
      await showCardDetails(showDetailsId);
    }
  } catch (error) {
    console.error('Erro ao carregar cartões virtuais:', error.message);
    showToast(`Erro ao carregar cartões virtuais: ${error.message}`, 'danger');
    elements.cardsContainer.innerHTML = '<p class="text-muted text-center">Erro ao carregar cartões virtuais.</p>';
  }
}

// Função para mostrar os detalhes do cartão
async function showCardDetails(cardId) {
  try {
    const card = await apiFetch(`/api/virtualCards/${cardId}`);

    if (!card || !card._id) throw new Error('Cartão não encontrado');

    const cardsListView = elements.cardsContainer.querySelector('#cardsListView');
    const cardDetailsView = elements.cardsContainer.querySelector('#cardDetailsView');

    cardsListView.classList.add('d-none');
    cardDetailsView.classList.remove('d-none');

    const fullNumber = card.number || '**** **** **** ' + (card.lastFour || '****');
    const cardCvv = card.cvv || '***';

    cardDetailsView.innerHTML = `
      <div class="p-4 bg-dark rounded text-center animate__animated animate__fadeIn">
        <div class="mb-3"><i class="fas fa-credit-card fa-3x text-primary"></i></div>
        <h5 class="mb-3">Detalhes do Cartão Virtual</h5>
        <div class="card-preview mt-3 p-3 bg-dark border rounded shadow-sm">
          <div class="d-flex align-items-center justify-content-center mb-3 flex-wrap gap-2">
            <small class="text-muted me-2">Número</small>
            <span id="numberDisplay" class="me-2">**** **** **** ${sanitizeHTML(card.lastFour)}</span>
            <button id="toggleNumberBtn" class="btn btn-sm btn-outline-primary me-2" title="Revelar Número">
              <i class="fas fa-eye"></i>
            </button>
            <button id="copyNumberBtn" class="btn btn-sm btn-outline-success" title="Copiar Número">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <div class="d-flex align-items-center justify-content-center mb-3 flex-wrap gap-2">
            <small class="text-muted me-2">Validade</small>
            <span id="expiryDisplay" class="me-2">${sanitizeHTML(card.expiry)}</span>
            <button id="copyExpiryBtn" class="btn btn-sm btn-outline-success" title="Copiar Validade">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <div class="d-flex align-items-center justify-content-center mb-3 flex-wrap gap-2">
            <small class="text-muted me-2">CVV</small>
            <span id="cvvDisplay" class="me-2">***</span>
            <button id="toggleCvvBtn" class="btn btn-sm btn-outline-primary me-2" title="Revelar CVV">
              <i class="fas fa-eye"></i>
            </button>
            <button id="copyCvvBtn" class="btn btn-sm btn-outline-success" title="Copiar CVV">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <div class="d-flex align-items-center justify-content-center mb-3 flex-wrap gap-2">
            <small class="text-muted me-2">Nome</small>
            <span id="nameDisplay" class="me-2">${sanitizeHTML(card.fullName || 'Usuário')}</span>
            <button id="copyNameBtn" class="btn btn-sm btn-outline-success" title="Copiar Nome">
              <i class="fas fa-copy"></i>
            </button>
          </div>
          <button id="backToListBtn" class="btn btn-outline-secondary mt-3 w-100">Voltar à Lista</button>
        </div>
      </div>
    `;

    // Controladores para mostrar/esconder número e CVV
    let numberVisible = false;
    let cvvVisible = false;

    const numberDisplay = cardDetailsView.querySelector('#numberDisplay');
    const toggleNumberBtn = cardDetailsView.querySelector('#toggleNumberBtn');
    const copyNumberBtn = cardDetailsView.querySelector('#copyNumberBtn');

    const cvvDisplay = cardDetailsView.querySelector('#cvvDisplay');
    const toggleCvvBtn = cardDetailsView.querySelector('#toggleCvvBtn');
    const copyCvvBtn = cardDetailsView.querySelector('#copyCvvBtn');

    const copyExpiryBtn = cardDetailsView.querySelector('#copyExpiryBtn');
    const copyNameBtn = cardDetailsView.querySelector('#copyNameBtn');
    const backToListBtn = cardDetailsView.querySelector('#backToListBtn');

    toggleNumberBtn.addEventListener('click', () => {
      numberVisible = !numberVisible;
      numberDisplay.textContent = numberVisible ? fullNumber : `**** **** **** ${card.lastFour}`;
      toggleNumberBtn.querySelector('i').className = numberVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
    });

    copyNumberBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(fullNumber);
      showToast('Número copiado com sucesso!', 'success');
    });

    toggleCvvBtn.addEventListener('click', () => {
      cvvVisible = !cvvVisible;
      cvvDisplay.textContent = cvvVisible ? cardCvv : '***';
      toggleCvvBtn.querySelector('i').className = cvvVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
    });

    copyCvvBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(cardCvv);
      showToast('CVV copiado com sucesso!', 'success');
    });

    copyExpiryBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(card.expiry);
      showToast('Validade copiada com sucesso!', 'success');
    });

    copyNameBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(card.fullName || 'Usuário');
      showToast('Nome copiado com sucesso!', 'success');
    });

    backToListBtn.addEventListener('click', () => {
      cardDetailsView.classList.add('d-none');
      cardsListView.classList.remove('d-none');
    });
  } catch (error) {
    console.error('Erro ao exibir detalhes:', error);
    showToast(`Erro: ${error.message}`, 'danger');
  }
}

// Você precisa definir `elements.cardsContainer` e `apiFetch` no seu código principal, por exemplo:
// const elements = { cardsContainer: document.getElementById('cardsContainer') };
// async function apiFetch(url) { /* fetch wrapper */ }

// E então chamar:
// loadVirtualCards();

