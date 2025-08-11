document.getElementById('formEmprestimo').addEventListener('submit', async (e) => {
  e.preventDefault();

  const valor = Number(document.getElementById('valor').value);
  const parcelas = Number(document.getElementById('parcelas').value);

  const resultado = document.getElementById('resultadoEmprestimo');
  resultado.textContent = `Simulação: ${parcelas}x de R$ ${(valor / parcelas).toFixed(2)}`;
});
