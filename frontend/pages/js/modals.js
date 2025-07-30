// frontend/pages/dashboard/js/modals.js

// Este arquivo deve conter o controle dos modais da dashboard (sem Bootstrap)

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }
}

export function setupModalTriggers() {
  document.querySelectorAll('[data-modal-open]').forEach(button => {
    button.addEventListener('click', () => {
      openModal(button.dataset.modalOpen);
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', () => {
      closeModal(button.dataset.modalClose);
    });
  });
}
