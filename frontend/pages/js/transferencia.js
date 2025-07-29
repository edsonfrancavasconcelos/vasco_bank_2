const pixKeyInput = document.getElementById('pix-key');
const amountInput = document.getElementById('amount');
const submitBtn = document.getElementById('submit-btn');
const pixError = document.getElementById('pix-error');
const pixLoading = document.getElementById('pix-loading');

function validateForm() {
  const pixKey = pixKeyInput.value.trim();
  const amount = parseFloat(amountInput.value);

  let isValid = true;
  pixError.textContent = '';

  // Validação simples da chave Pix (ex: mínimo 5 caracteres)
  if (pixKey.length < 5) {
    pixError.textContent = 'Chave Pix inválida (mínimo 5 caracteres)';
    isValid = false;
  }

  // Valor positivo maior que zero
  if (isNaN(amount) || amount <= 0) {
    isValid = false;
  }

  submitBtn.disabled = !isValid;
}

// Ouça mudanças para validar ao digitar
pixKeyInput.addEventListener('input', validateForm);
amountInput.addEventListener('input', validateForm);

// Valide na carga também (caso já tenha algo preenchido)
validateForm();

// Submissão do formulário
document.getElementById('transfer-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const pixKey = pixKeyInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const description = document.getElementById('description').value.trim();

  pixError.textContent = '';
  pixLoading.textContent = 'Processando...';

  try {
    const response = await fetch('/api/transactions/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountNumber: pixKey,  // Assumindo que sua chave pix é o accountNumber no backend
        amount,
        description
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      pixError.textContent = data.error || 'Erro na transferência';
      pixLoading.textContent = '';
      return;
    }

    pixLoading.textContent = 'Transferência realizada com sucesso!';
    submitBtn.disabled = true;

    // Opcional: limpar form
    pixKeyInput.value = '';
    amountInput.value = '';
    document.getElementById('description').value = '';
    validateForm();

  } catch (error) {
    pixError.textContent = 'Erro ao conectar com o servidor.';
    pixLoading.textContent = '';
    console.error(error);
  }
});
