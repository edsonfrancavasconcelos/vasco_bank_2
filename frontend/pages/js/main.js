import * as userModule from './user.js';
import * as cardsModule from './cards.js';
import * as pixModule from './pix.js';
import * as financesModule from './finances.js';
import * as investmentsModule from './investments.js';
import * as transactionsModule from './transactions.js';
import * as modalsModule from './modals.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await userModule.loadUserData();
    setupEventListeners();
  } catch (error) {
    console.error('Erro ao inicializar dashboard:', error);
  }
});

function setupEventListeners() {
  document.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      const action = e.currentTarget.dataset.action;
      handleAction(action);
    });
  });
}

function handleAction(action) {
  switch (action) {
    case 'open-pix':
      pixModule.openPixArea();
      break;
    case 'open-cards':
      cardsModule.openCardsArea();
      break;
    case 'open-finances':
      financesModule.openFinancesArea();
      break;
    case 'open-investments':
      investmentsModule.openInvestmentsArea();
      break;
    case 'open-transactions':
      transactionsModule.openTransactionsArea();
      break;
    default:
      console.warn('Ação não mapeada:', action);
  }
}
