# vbank
// Arquivo: frontend/src/utils.js
function abrirModalSimples(titulo, conteudo) {
  console.log('[abrirModalSimples] Renderizando modal com título:', titulo);
  const modalExistente = document.getElementById('modalPix');
  if (modalExistente) {
    console.log('[abrirModalSimples] Removendo modal existente');
    modalExistente.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'modalPix';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';

  modal.innerHTML = 
    <div style="background: #fff; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%; text-align: center;">
      <h2>${titulo}</h2>
      ${conteudo}
    </div>
  `;

  document.body.appendChild(modal);
  console.log('[abrirModalSimples] Modal inserido no DOM');

  const img = modal.querySelector('img');
  if (img) {
    console.log('[abrirModalSimples] Imagem encontrada no DOM, src:', img.src.substring(0, 50) + '...');
    img.onload = () => console.log('[abrirModalSimples] Imagem do modal carregada com sucesso');
    img.onerror = () => console.error('[abrirModalSimples] Erro ao carregar imagem do modal');
  } else {
    console.error('[abrirModalSimples] Imagem não encontrada no DOM');
  }

}
