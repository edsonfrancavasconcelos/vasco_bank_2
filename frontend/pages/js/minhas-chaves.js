document.addEventListener("DOMContentLoaded", () => {
  const pixKeysList = document.getElementById("pixKeysList");
  const pixKeysMessage = document.getElementById("pixKeysMessage");

  async function loadPixKeys() {
      try {
          const response = await fetch("http://localhost:3000/api/pix/my-keys");
          const data = await response.json();

          if (data.keys && data.keys.length > 0) {
              pixKeysList.innerHTML = data.keys.map(key => `<li class="list-group-item">${key.chave} - ${key.nome}</li>`).join("");
              pixKeysMessage.textContent = "";
          } else {
              pixKeysList.innerHTML = "";
              pixKeysMessage.textContent = "Nenhuma chave Pix registrada.";
          }
      } catch (error) {
          pixKeysMessage.textContent = "Erro ao carregar suas chaves.";
      }
  }

  loadPixKeys();
});