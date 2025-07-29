// script.js

document.addEventListener("DOMContentLoaded", function () {
  const carousel = document.querySelector(".carousel");

  if (!carousel) {
    console.warn("Elemento .carousel não encontrado.");
    return;
  }

  let isDown = false;
  let startX;
  let scrollLeft;

  // Detecta se está em dispositivo com tela tátil ou mouse
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const startScroll = (x) => {
    isDown = true;
    carousel.classList.add("active");
    startX = x - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  };

  const moveScroll = (x) => {
    if (!isDown) return;
    const walk = (x - startX) * 1.5; // velocidade reduzida para maior controle
    carousel.scrollLeft = scrollLeft - walk;
  };

  const endScroll = () => {
    isDown = false;
    carousel.classList.remove("active");
  };

  if (isTouchDevice) {
    // Suporte a toque (mobile/tablets)
    carousel.addEventListener("touchstart", (e) => startScroll(e.touches[0].pageX));
    carousel.addEventListener("touchmove", (e) => moveScroll(e.touches[0].pageX));
    carousel.addEventListener("touchend", endScroll);
  } else {
    // Suporte a mouse (desktop/laptops)
    carousel.addEventListener("mousedown", (e) => startScroll(e.pageX));
    carousel.addEventListener("mousemove", (e) => moveScroll(e.pageX));
    carousel.addEventListener("mouseup", endScroll);
    carousel.addEventListener("mouseleave", endScroll);
  }
});
