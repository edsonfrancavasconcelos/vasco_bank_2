document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('loginModal');
  const loginBtn = document.getElementById('card-login');
  const closeBtn = document.getElementById('loginCloseBtn');
  const loginForm = document.getElementById('loginForm');

  // Caso use Bootstrap 5 Modal, crie a instância:
  let bootstrapModal;
  if (modal && typeof bootstrap !== 'undefined') {
    bootstrapModal = new bootstrap.Modal(modal);
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (bootstrapModal) {
        bootstrapModal.show();
      } else if (modal) {
        modal.style.display = 'block';
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (bootstrapModal) {
        bootstrapModal.hide();
      } else if (modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Fechar modal clicando fora do conteúdo (background)
  if (window && modal) {
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        if (bootstrapModal) {
          bootstrapModal.hide();
        } else {
          modal.style.display = 'none';
        }
      }
    });
  }

  // Ações dos cards Pix, Produtos e Serviços
  const cardPix = document.getElementById('card-pix');
  if (cardPix) {
    cardPix.addEventListener('click', () => {
      alert('Funcionalidade Pix em desenvolvimento!');
    });
  }

  const cardProdutos = document.getElementById('card-produtos');
  if (cardProdutos) {
    cardProdutos.addEventListener('click', () => {
      alert('Aqui você verá nossos produtos!');
    });
  }

  const cardServicos = document.getElementById('card-servicos');
  if (cardServicos) {
    cardServicos.addEventListener('click', () => {
      alert('Conheça nossos serviços!');
    });
  }

  // Submissão do formulário de login
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.email.value.trim();
      const password = e.target.password.value.trim();

      if (email && password) {
        alert(`Tentativa de login com email: ${email}`);
        if (bootstrapModal) {
          bootstrapModal.hide();
        } else if (modal) {
          modal.style.display = 'none';
        }
        e.target.reset();
      } else {
        alert('Preencha email e senha');
      }
    });
  }
});
