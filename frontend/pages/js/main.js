// js/main.js
import { initLoginPage } from "./login.js";
import { initDashboard } from "./dashboard.js";
import { initPixPage } from "./pix.js";
import { initProdutosPage } from "./produtos.js";
import { initSegurosPage } from "./seguros.js";
import { initServicosPage } from "./servicos.js";
import { initTransacoesPage } from "./transaction.js";


document.addEventListener("DOMContentLoaded", () => {
  console.log("Iniciando main.js");
  const body = document.body;

  // Garante que todas as páginas tenham a classe 'body'
  if (!body.classList.contains("body")) {
    body.classList.add("body");
  }

 

  // Inicializações específicas por página
  if (body.classList.contains("body-login")) initLoginPage();
  if (body.classList.contains("body-dashboard")) initDashboard();
  if (body.classList.contains("body-pix")) initPixPage();
  if (body.classList.contains("body-produtos")) initProdutosPage();
  if (body.classList.contains("body-seguros")) initSegurosPage();
  if (body.classList.contains("body-servicos")) initServicosPage();
  if (body.classList.contains("body-transacoes")) initTransacoesPage();

  // Efeito Parallax apenas para páginas que usam body padrão
  if (body.classList.contains("body")) {
    window.addEventListener("scroll", () => {
      const scrollY = window.scrollY;
      body.style.backgroundPosition = `center ${scrollY * 0.5}px`;
    });
  }
});
