document.addEventListener('DOMContentLoaded', () => {
  const preload = document.getElementById('preload');
  if (preload) {
    setTimeout(() => {
      preload.classList.add('hidden');
      console.log('Preload ocultado');
      preload.style.display = 'none';
      preload.style.pointerEvents = 'none'; // Garante que não intercepta cliques
      setTimeout(() => {
        preload.remove(); // Remove completamente do DOM
        console.log('Preload removido do DOM');
      }, 400); // Após a transição de opacidade
    }, 90);
  } else {
    console.warn('Elemento #preload não encontrado');
  }
});