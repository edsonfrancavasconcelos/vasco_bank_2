// frontend/src/cardArea.js
document.addEventListener('DOMContentLoaded', () => {
  // Estado local
  let cartoes = { fisicos: [], virtuais: [] };

  // Token e headers
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Token não encontrado no localStorage');
    alert('Por favor, faça login novamente.');
    return;
  }
  const headersAutenticados = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Elementos de botões e seções
  const btnCriarFisico = document.getElementById('btnCriarFisico');
  const btnCriarVirtual = document.getElementById('btnCriarVirtual');
  const btnPedirNovo = document.getElementById('btnPedirNovo');
  const btnVerCartoes = document.getElementById('btnVerCartoes');

  const secCriarFisico = document.getElementById('secCriarFisico');
  const secCriarVirtual = document.getElementById('secCriarVirtual');
  const secPedirNovo = document.getElementById('secPedirNovo');
  const secVerCartoes = document.getElementById('secVerCartoes');

  const formCriarVirtual = document.getElementById('formCriarVirtual');
  const formCriarFisico = document.getElementById('formCriarFisico');
  const formPedirNovo = document.getElementById('formPedirNovo');

  const cartaoVirtualContainer = document.getElementById('cartaoVirtualContainer');

  // Verificação de elementos do DOM
  if (!btnPedirNovo) console.error('Botão btnPedirNovo não encontrado no DOM');
  if (!formPedirNovo) console.error('Formulário formPedirNovo não encontrado no DOM');
  if (!document.getElementById('motivo')) console.error('Campo motivo não encontrado no DOM');

  // Funções utilitárias
  function esconderTodasSecoes() {
    if (secCriarFisico) secCriarFisico.style.display = 'none';
    if (secCriarVirtual) secCriarVirtual.style.display = 'none';
    if (secPedirNovo) secPedirNovo.style.display = 'none';
    if (secVerCartoes) secVerCartoes.style.display = 'none';
  }

  function gerarNumeroCartao() {
    const partes = [];
    for (let i = 0; i < 4; i++) {
      partes.push(Math.floor(1000 + Math.random() * 9000));
    }
    return partes.join(' ');
  }

  function gerarCvv() {
    return Math.floor(100 + Math.random() * 900).toString();
  }

  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      alert('Copiado para a área de transferência!');
    } catch {
      alert('Falha ao copiar. Tente manualmente.');
    }
  }

  // Mostrar seção ao clicar
  if (btnCriarFisico) {
    btnCriarFisico.onclick = () => {
      console.log('Botão btnCriarFisico clicado');
      esconderTodasSecoes();
      secCriarFisico.style.display = 'block';
    };
  }
  if (btnCriarVirtual) {
    btnCriarVirtual.onclick = () => {
      console.log('Botão btnCriarVirtual clicado');
      esconderTodasSecoes();
      secCriarVirtual.style.display = 'block';
    };
  }
  if (btnPedirNovo) {
    btnPedirNovo.onclick = () => {
      console.log('Botão btnPedirNovo clicado - Mostrando secPedirNovo');
      esconderTodasSecoes();
      secPedirNovo.style.display = 'block';
    };
  }
  if (btnVerCartoes) {
    btnVerCartoes.onclick = async () => {
      console.log('Botão btnVerCartoes clicado');
      esconderTodasSecoes();
      await atualizarListaCartoes();
      secVerCartoes.style.display = 'block';
    };
  }

  // Criar cartão físico - submit form
  if (formCriarFisico) {
    formCriarFisico.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Formulário formCriarFisico enviado');
      const nome = document.getElementById('nomeFisico')?.value.trim();
      if (!nome) {
        alert('Informe o nome do titular');
        return;
      }

      try {
        console.log('Enviando para /api/cards/fisico:', { nomeTitular: nome });
        const res = await fetch('/api/cards/fisico', {
          method: 'POST',
          headers: headersAutenticados,
          body: JSON.stringify({ nomeTitular: nome }),
        });
        const data = await res.json();
        console.log('Resposta do servidor:', data);
        if (!res.ok) {
          console.error('Erro na requisição:', data);
          throw new Error(data.error || 'Erro ao solicitar cartão físico');
        }

        cartoes.fisicos.push({ nomeTitular: nome, criadoEm: new Date().toLocaleDateString() });
        alert('Cartão físico solicitado com sucesso para: ' + nome);
        formCriarFisico.reset();
        await atualizarListaCartoes();
      } catch (error) {
        console.error('Erro em formCriarFisico:', error.message, error.stack);
        alert('Erro: ' + error.message);
      }
    });
  }

  // Criar cartão virtual - submit form
  if (formCriarVirtual) {
    formCriarVirtual.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Formulário formCriarVirtual enviado');
      const nome = document.getElementById('nomeTitular')?.value.trim();
      if (!nome) {
        alert('Informe o nome do titular');
        return;
      }

      const numero = gerarNumeroCartao();
      const cvv = gerarCvv();
      const validade = '12/29';

      try {
        console.log('Enviando para /api/cards/virtual:', { nomeTitular: nome, numero, cvv, validade });
        const res = await fetch('/api/cards/virtual', {
          method: 'POST',
          headers: headersAutenticados,
          body: JSON.stringify({ nomeTitular: nome, numero, cvv, validade }),
        });
        const data = await res.json();
        console.log('Resposta do servidor:', data);
        if (!res.ok) throw new Error(data.error || 'Erro ao criar cartão virtual');

        cartoes.virtuais.push({ nomeTitular: nome, numero, cvv, validade });
        mostrarCartaoVirtual({ nomeTitular: nome, numero, cvv, validade });

        formCriarVirtual.reset();
        alert('Cartão virtual criado com sucesso!');
      } catch (error) {
        console.error('Erro em formCriarVirtual:', error.message, error.stack);
        alert('Erro: ' + error.message);
      }
    });
  }

  // Pedir novo cartão - submit form
  if (formPedirNovo) {
    formPedirNovo.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Formulário formPedirNovo enviado');
      const motivo = document.getElementById('motivo')?.value.trim();
      if (!motivo) {
        console.log('Motivo não fornecido');
        alert('Informe o motivo');
        return;
      }

      try {
        console.log('Enviando para /api/cards/novo:', { motivo });
        const res = await fetch('/api/cards/novo', {
          method: 'POST',
          headers: headersAutenticados,
          body: JSON.stringify({ motivo }),
        });
        const data = await res.json();
        console.log('Resposta do servidor:', data);
        if (!res.ok) {
          console.error('Erro na requisição:', data);
          throw new Error(data.error || 'Erro ao pedir novo cartão');
        }

        alert('Novo cartão solicitado com sucesso!');
        formPedirNovo.reset();
      } catch (error) {
        console.error('Erro em formPedirNovo:', error.message, error.stack);
        alert('Erro: ' + error.message);
      }
    });
  }

  async function excluirCartaoVirtual(id) {
    try {
      console.log('Enviando DELETE para /api/cards/virtual/', id);
      const res = await fetch(`/api/cards/virtual/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log('Resposta do servidor:', data);
      if (!res.ok) {
        console.error('Erro na requisição:', data);
        throw new Error(data.error || 'Erro ao excluir cartão virtual');
      }

      alert('Cartão virtual excluído com sucesso!');
      await atualizarListaCartoes();
    } catch (error) {
      console.error('Erro em excluirCartaoVirtual:', error.message, error.stack);
      alert('Erro: ' + error.message);
    }
  }

  // Função para atualizar lista de cartões
  async function atualizarListaCartoes() {
    const lista = document.getElementById('listaCartoes');
    if (!lista) {
      console.error('Elemento listaCartoes não encontrado');
      return;
    }
    lista.innerHTML = '';

    try {
      console.log('Buscando cartões em /api/cards/meus-cartoes');
      const res = await fetch('/api/cards/meus-cartoes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log('Resposta do servidor:', data);
      if (!res.ok) {
        console.error('Erro na requisição:', data);
        throw new Error(data.error || 'Erro ao buscar cartões');
      }

      const fisicos = data.filter((c) => c.tipo === 'fisico');
      const virtuais = data.filter((c) => c.tipo === 'virtual');

      if (fisicos.length > 0) {
        const tituloFisicos = document.createElement('h3');
        tituloFisicos.textContent = 'Cartões Físicos';
        tituloFisicos.style.color = '#ff6600';
        lista.appendChild(tituloFisicos);

        const ulFisicos = document.createElement('ul');
        ulFisicos.style.paddingLeft = '20px';
        fisicos.forEach((c) => {
          const li = document.createElement('li');
          li.textContent = `Titular: ${c.nomeUsuario || 'Sem nome'} — Solicitado em: ${new Date(c.criadoEm).toLocaleDateString()}`;
          ulFisicos.appendChild(li);
        });
        lista.appendChild(ulFisicos);
      } else {
        const p = document.createElement('p');
        p.textContent = 'Nenhum cartão físico cadastrado.';
        lista.appendChild(p);
      }

      if (virtuais.length > 0) {
        const tituloVirtuais = document.createElement('h3');
        tituloVirtuais.textContent = 'Cartões Virtuais';
        tituloVirtuais.style.color = '#ff6600';
        lista.appendChild(tituloVirtuais);

        const ulVirtuais = document.createElement('ul');
        ulVirtuais.style.paddingLeft = '20px';
        virtuais.forEach((c) => {
          const li = document.createElement('li');
          li.style.display = 'flex';
          li.style.justifyContent = 'space-between';
          li.style.alignItems = 'center';
          li.style.marginBottom = '6px';

          const info = document.createElement('span');
          info.textContent = `Titular: ${c.nomeUsuario || 'Sem nome'} — Criado em: ${new Date(c.criadoEm).toLocaleDateString()}`;

          const btnExcluir = document.createElement('button');
          btnExcluir.textContent = 'Excluir';
          btnExcluir.style.backgroundColor = '#ff3300';
          btnExcluir.style.color = '#fff';
          btnExcluir.style.border = 'none';
          btnExcluir.style.padding = '4px 10px';
          btnExcluir.style.borderRadius = '4px';
          btnExcluir.style.cursor = 'pointer';

          btnExcluir.addEventListener('click', async () => {
            if (confirm('Deseja realmente excluir este cartão virtual?')) {
              await excluirCartaoVirtual(c._id);
            }
          });

          li.appendChild(info);
          li.appendChild(btnExcluir);
          ulVirtuais.appendChild(li);
        });

        lista.appendChild(ulVirtuais);
      } else {
        const p = document.createElement('p');
        p.textContent = 'Nenhum cartão virtual cadastrado.';
        lista.appendChild(p);
      }
    } catch (error) {
      console.error('Erro ao buscar cartões:', error.message, error.stack);
      const p = document.createElement('p');
      p.style.color = 'red';
      p.textContent = 'Erro ao carregar cartões. Tente novamente mais tarde.';
      lista.appendChild(p);
    }
  }

  // Função para mostrar cartão virtual
  function mostrarCartaoVirtual(cartao) {
    const { numero, nomeTitular, cvv, validade } = cartao;

    if (!cartaoVirtualContainer) {
      console.error('Elemento cartaoVirtualContainer não encontrado');
      return;
    }

    cartaoVirtualContainer.innerHTML = `
      <div style="
        width: 350px; height: 200px; border-radius: 15px; 
        background: linear-gradient(135deg, #0c0b0cff, #1c171fff); 
        color: white; padding: 20px; position: relative; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        
        <img src="img/vb_bank.png" alt="VBank" style="height: 120px; position: absolute; top: -15px; left: 20px;">
        <img src="/img/mastercard.png" alt="MasterCard" style="height: 70px; position: absolute; bottom: 15px; right: 20px;">
        
        <div style="position: absolute; bottom: 50px; left: 20px;"></div>
      </div>
      
      <form style="margin-top: 20px; max-width: 350px; border-radius:8px; font-family: Arial, sans-serif;">
        <label>Nome do Titular:</label><br>
        <input type="text" readonly value="${nomeTitular}" style="width: 100%; border-radius:8px; margin-bottom: 10px; padding: 8px;"><br>
        
        <label>Número do Cartão:</label><br>
        <input type="text" readonly value="${numero}" style="width: 100%; border-radius:8px; margin-bottom: 10px; padding: 8px;">
        <button type="button" id="btnCopyNumeroDetalhes" style="margin-right: 10px; border-radius:8px;">Copiar Número</button><br>
        
        <label>Validade:</label><br>
        <input type="text" readonly value="${validade}" style="width: 100%; border-radius:8px; margin-bottom: 10px; padding: 8px;"><br>
        <button type="button" id="btnCopyValidadeDetalhes" style="margin-right: 10px; border-radius:8px;">Copiar Validade</button><br>
         
        <label>CVV:</label><br>
        <input type="password" readonly value="${cvv}" id="inputCvvDetalhes" style="width: 100%; border-radius:8px; margin-bottom: 10px; padding: 8px;">
        <button type="button" id="btnToggleCvvDetalhes" style="margin-right: 10px; border-radius:8px;">Mostrar/Ocultar CVV</button>
        <button type="button" id="btnCopyCvvDetalhes" style="margin-right: 10px; border-radius:8px;">Copiar CVV</button>
      </form>
    `;

    cartaoVirtualContainer.style.display = 'block';

    document.getElementById('btnCopyNumeroDetalhes').onclick = async () => {
      await copiarTexto(numero);
    };
    document.getElementById('btnCopyValidadeDetalhes').onclick = async () => {
      await copiarTexto(validade);
    };
    const inputCvvDetalhes = document.getElementById('inputCvvDetalhes');
    const btnToggleCvvDetalhes = document.getElementById('btnToggleCvvDetalhes');
    btnToggleCvvDetalhes.onclick = () => {
      if (inputCvvDetalhes.type === 'password') {
        inputCvvDetalhes.type = 'text';
        btnToggleCvvDetalhes.textContent = 'Ocultar CVV';
      } else {
        inputCvvDetalhes.type = 'password';
        btnToggleCvvDetalhes.textContent = 'Mostrar CVV';
      }
    };
    document.getElementById('btnCopyCvvDetalhes').onclick = async () => {
      await copiarTexto(cvv);
    };
  }

  // Inicializa mostrando lista de cartões
  atualizarListaCartoes();
  esconderTodasSecoes();
});