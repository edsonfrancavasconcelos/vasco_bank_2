import"./modulepreload-polyfill-B5Qt9EMX.js";console.log(`[${new Date().toISOString()}] pix.js carregado`);function i(e,a,o){const r=document.getElementById("modalPix");r&&r.remove();const t=document.createElement("div");t.id="modalPix",Object.assign(t.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%)",backgroundColor:"#222",padding:"20px",borderRadius:"8px",boxShadow:"0 0 10px rgba(0,0,0,0.7)",color:"white",zIndex:1e4,width:"320px",maxHeight:"90vh",overflowY:"auto"}),t.innerHTML=`
    <h2 style="color: #ff6600; margin-bottom: 10px;">${e}</h2>
    <div>${a}</div>
    <div style="margin-top: 20px; text-align: right;">
      <button id="btnCancelar" style="background: #555; color: #fff; border:none; padding: 8px 16px; margin-right: 10px; border-radius: 6px; cursor: pointer;">Cancelar</button>
      ${o?'<button id="btnConfirmar" style="background: #ff6600; color: #fff; border:none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Confirmar</button>':""}
    </div>
  `,document.body.appendChild(t),t.addEventListener("click",n=>{n.target===t&&t.remove()}),document.getElementById("btnCancelar").onclick=()=>t.remove(),o&&(document.getElementById("btnConfirmar").onclick=o)}function s(e,a){const o=document.getElementById("modalPix");o&&o.remove();const r=document.createElement("div");r.id="modalPix",Object.assign(r.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%)",backgroundColor:"#222",padding:"20px",borderRadius:"8px",boxShadow:"0 0 10px rgba(0,0,0,0.7)",color:"white",zIndex:1e4,width:"320px",maxHeight:"90vh",overflowY:"auto"}),r.innerHTML=`
    <h2 style="color: #ff6600; margin-bottom: 10px;">${e}</h2>
    <div>${a}</div>
  `,document.body.appendChild(r),r.addEventListener("click",t=>{t.target===r&&r.remove()})}const g=()=>!!localStorage.getItem("token"),d=e=>{if(!g()){alert("Faça login para acessar esta funcionalidade.");return}return e()};function m(){d(()=>{i("Enviar Pix",`
      <label>Chave destino:<br/>
        <input id="inputChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: email, CPF, telefone ou chave aleatória"/>
      </label><br/><br/>
      <label>Valor:<br/>
        <input id="inputValor" type="number" min="0.01" step="0.01" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
      </label>
      <label>Descrição (opcional):<br/>
        <input id="inputDescricao" type="text" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: Pagamento de serviço"/>
      </label>
    `,async()=>{const e=document.getElementById("inputChave").value.trim(),a=parseFloat(document.getElementById("inputValor").value),o=document.getElementById("inputDescricao").value.trim();if(!e)return alert("Informe a chave destino.");if(!a||a<=0)return alert("Informe um valor válido.");try{console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/enviar:`,{chave:e,valor:a,descricao:o});const r=await fetch("/api/pix/enviar",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify({chave:e,valor:a,descricao:o})}),t=await r.json();if(!r.ok)throw new Error(t.error||"Erro ao enviar Pix.");console.log(`[${new Date().toISOString()}] Pix enviado:`,t),w({deUsuario:"Você",paraChave:e,valor:a,descricao:o,data:new Date}),alert("Pix enviado com sucesso!"),document.getElementById("modalPix").remove()}catch(r){console.error(`[${new Date().toISOString()}] Erro em enviarPix:`,r.message),alert(`Erro: ${r.message}`)}})})}async function u(){d(async()=>{i("Receber Pix","<p>Carregando chaves...</p>");try{console.log(`[${new Date().toISOString()}] Buscando chaves em /api/pix/chaves`);const e=await fetch("/api/pix/chaves",{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}}),a=await e.json();if(!e.ok)throw new Error(a.error||"Erro ao buscar chaves");if(!a.length){document.querySelector("#modalPix div:nth-child(2)").innerHTML="<p>Nenhuma chave Pix cadastrada. Cadastre uma chave primeiro.</p>";return}i("Receber Pix",`
        <label>Chave Pix:<br/>
          <select id="inputChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;">
            <option value="">Selecione uma chave...</option>
            ${a.map(o=>`<option value="${o.valor}">${o.tipo.toUpperCase()}: ${o.valor}</option>`).join("")}
          </select>
        </label><br/><br/>
        <label>Valor (opcional):<br/>
          <input id="inputValor" type="number" min="0.01" step="0.01" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: 100.00" />
        </label><br/><br/>
        <label>Descrição (opcional):<br/>
          <input id="inputDescricao" type="text" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: Pagamento de serviço" />
        </label>
      `,async()=>{const o=document.getElementById("inputChave").value.trim(),r=parseFloat(document.getElementById("inputValor").value)||void 0,t=document.getElementById("inputDescricao").value.trim()||void 0;if(!o)return alert("Selecione uma chave Pix.");try{console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/receber:`,{chave:o,valor:r,descricao:t});const n=await fetch("/api/pix/receber",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify({chave:o,valor:r,descricao:t})}),c=await n.text();if(!n.ok)try{const p=JSON.parse(c);throw new Error(p.error||"Erro ao gerar QR Code")}catch{throw new Error("Resposta não é JSON válido: "+c)}const l=JSON.parse(c);if(!l.qrCodeBase64||!l.qrCodeBase64.startsWith("data:image/png;base64,"))throw new Error("QR Code inválido ou não recebido.");console.log(`[${new Date().toISOString()}] QR Code recebido, tamanho: ${l.qrCodeBase64.length}`),s("QR Code Pix",`
            <img src="${l.qrCodeBase64}" alt="QR Code Pix" style="width: 100%; height: auto;"/>
            <p style="margin-top: 10px; font-size: 14px;">Use esse QR code para receber pagamentos Pix.</p>
            <p style="font-size: 12px; word-break: break-all;">Copia e Cola: ${l.pixPayload}</p>
            <button onclick="navigator.clipboard.writeText('${l.pixPayload}').then(() => alert('Código copiado!'))" style="background: #ff6600; color: #fff; border:none; padding: 8px 16px; margin-top: 10px; margin-right: 10px; border-radius: 6px; cursor: pointer;">Copiar Código</button>
            <button onclick="document.getElementById('modalPix').remove()" style="background: #555; color: #fff; border:none; padding: 8px 16px; margin-top: 10px; border-radius: 6px; cursor: pointer;">Voltar</button>
          `)}catch(n){console.error(`[${new Date().toISOString()}] Erro em receberPix:`,n.message),i("Erro",`<p style="color:red;">${n.message}</p>`)}})}catch(e){console.error(`[${new Date().toISOString()}] Erro ao buscar chaves:`,e.message),document.querySelector("#modalPix div:nth-child(2)").innerHTML=`<p style="color:red;">${e.message}</p>`}})}function h(){d(()=>{i("Agendar Pix",`
      <label>Chave destino:<br/>
        <input id="inputChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: email, CPF, telefone ou chave aleatória"/>
      </label><br/><br/>
      <label>Valor:<br/>
        <input id="inputValor" type="number" min="0.01" step="0.01" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
      </label><br/><br/>
      <label>Data de agendamento:<br/>
        <input id="inputDataAgendamento" type="datetime-local" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
      </label><br/><br/>
      <label>Descrição (opcional):<br/>
        <input id="inputDescricao" type="text" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Ex: Pagamento de serviço" />
      </label>
    `,async()=>{const e=document.getElementById("inputChave").value.trim(),a=parseFloat(document.getElementById("inputValor").value),o=document.getElementById("inputDataAgendamento").value,r=document.getElementById("inputDescricao").value.trim();if(!e||!a||!o)return alert("Chave, valor e data de agendamento são obrigatórios.");try{console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/agendar:`,{chave:e,valor:a,dataAgendamento:o,descricao:r});const t=await fetch("/api/pix/agendar",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify({chave:e,valor:a,dataAgendamento:o,descricao:r})}),n=await t.json();if(!t.ok)throw new Error(n.error||"Erro ao agendar Pix.");console.log(`[${new Date().toISOString()}] Pix agendado:`,n),alert(`Pix agendado com sucesso: ${n.message}`),document.getElementById("modalPix").remove()}catch(t){console.error(`[${new Date().toISOString()}] Erro em agendarPix:`,t.message),alert(`Erro: ${t.message}`)}})})}function x(){d(()=>{i("Criar Cobrança Pix",`
      <label>Chave Pix:<br/>
        <input id="inputChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Digite a chave Pix" />
      </label><br/><br/>
      <label>Valor:<br/>
        <input id="inputValor" type="number" min="0.01" step="0.01" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Digite o valor" />
      </label><br/><br/>
      <label>Descrição (opcional):<br/>
        <input id="inputDescricao" type="text" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Descrição (opcional)" />
      </label>
    `,async()=>{const e=document.getElementById("inputChave").value.trim(),a=parseFloat(document.getElementById("inputValor").value),o=document.getElementById("inputDescricao").value.trim();if(!e||!a)return alert("Chave e valor são obrigatórios.");try{console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/cobrar:`,{chave:e,valor:a,descricao:o});const r=await fetch("/api/pix/cobrar",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify({chave:e,valor:a,descricao:o})}),t=await r.json();if(!r.ok)throw new Error(t.error||"Erro ao criar cobrança Pix.");console.log(`[${new Date().toISOString()}] Cobrança criada:`,t),s("Cobrança Pix Criada",`
          <p>${t.message}</p>
          <img src="${t.qrCodeBase64}" alt="QR Code Pix" style="width: 100%; height: auto;"/>
          <p style="margin-top: 10px; font-size: 14px;">Use esse QR code para receber o pagamento.</p>
          <p style="font-size: 12px; word-break: break-all;">Copia e Cola: ${t.pixPayload}</p>
          <button onclick="navigator.clipboard.writeText('${t.pixPayload}').then(() => alert('Código copiado!'))" style="background: #ff6600; color: #fff; border:none; padding: 8px 16px; margin-top: 10px; margin-right: 10px; border-radius: 6px; cursor: pointer;">Copiar Código</button>
          <button onclick="document.getElementById('modalPix').remove()" style="background: #555; color: #fff; border:none; padding: 8px 16px; margin-top: 10px; border-radius: 6px; cursor: pointer;">Voltar</button>
        `)}catch(r){console.error(`[${new Date().toISOString()}] Erro em cobrarPix:`,r.message),alert(`Erro: ${r.message}`)}})})}function b(){d(()=>{i("Ler QR Code Pix",`
      <p>Insira o código Pix ou chave manualmente:</p>
      <input id="inputQRCode" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Cole o código Pix ou digite a chave" />
    `,async()=>{const e=document.getElementById("inputQRCode").value.trim();if(!e)return alert("Informe o código Pix ou uma chave válida.");try{console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/ler-qrcode:`,{codigo:e});const a=await fetch("/api/pix/ler-qrcode",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify({codigo:e})}),o=await a.json();if(!a.ok)throw new Error(o.error||"Erro ao processar o código Pix.");console.log(`[${new Date().toISOString()}] Código Pix lido:`,o),alert(`Informações salvas: ${o.message}`),document.getElementById("modalPix").remove()}catch(a){console.error(`[${new Date().toISOString()}] Erro em lerQRCode:`,a.message),alert(`Erro: ${a.message}`)}})})}async function v(){d(async()=>{i("Pix Copia e Cola","<p>Carregando chave Pix...</p>");try{console.log(`[${new Date().toISOString()}] Buscando chaves em /api/pix/chaves`);const e=await fetch("/api/pix/chaves",{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}}),a=await e.json();if(!e.ok)throw new Error(a.error||"Erro ao buscar chaves");const o=a.length?a.map(r=>`
            <div style="margin-bottom:10px; padding:8px; background:#333; border-radius:4px; cursor:pointer;" onclick="navigator.clipboard.writeText('${r.valor}').then(() => alert('Chave copiada: ${r.valor}'));">
              <strong>${r.tipo.toUpperCase()}:</strong> ${r.valor}
            </div>`).join(""):"<p>Nenhuma chave cadastrada.</p>";document.querySelector("#modalPix div:nth-child(2)").innerHTML=o}catch(e){console.error(`[${new Date().toISOString()}] Erro em pixCopiaCola:`,e.message),document.querySelector("#modalPix div:nth-child(2)").innerHTML=`<p style="color:red;">${e.message}</p>`}})}function y(){d(()=>{i("Cadastrar Chave Pix",`
      <label>Tipo da chave:<br/>
        <select id="inputTipoChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;">
          <option value="">Selecione...</option>
          <option value="email">Email</option>
          <option value="cpf">CPF</option>
          <option value="telefone">Telefone</option>
          <option value="aleatorio">Aleatório</option>
        </select>
      </label><br/><br/>
      <label>Valor da chave:<br/>
        <input id="inputValorChave" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" placeholder="Digite o valor da chave" />
      </label>
    `,async()=>{const e=document.getElementById("inputTipoChave").value,a=document.getElementById("inputValorChave").value.trim();if(!e)return alert("Selecione o tipo da chave.");if(!a)return alert("Informe o valor da chave.");try{console.log(`[${new Date().toISOString()}] Enviando POST para /api/pix/chaves:`,{tipo:e,valor:a});const o=await fetch("/api/pix/chaves",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify({tipo:e,valor:a})}),r=await o.json();if(!o.ok)throw new Error(r.error||"Erro ao cadastrar chave.");console.log(`[${new Date().toISOString()}] Chave Pix cadastrada:`,r),alert("Chave Pix cadastrada com sucesso!"),document.getElementById("modalPix").remove()}catch(o){console.error(`[${new Date().toISOString()}] Erro em cadastrarChavePix:`,o.message),alert(`Erro: ${o.message}`)}})})}async function f(){d(async()=>{i("Minhas Chaves Pix","<p>Carregando chaves...</p>");try{console.log(`[${new Date().toISOString()}] Buscando chaves em /api/pix/chaves`);const e=await fetch("/api/pix/chaves",{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}}),a=await e.json();if(!e.ok)throw new Error(a.error||"Erro ao carregar chaves");const o=a.length?'<ul style="padding-left: 20px;">'+a.map(r=>`<li>${r.tipo.toUpperCase()}: ${r.valor}</li>`).join("")+"</ul>":"<p>Nenhuma chave cadastrada.</p>";document.querySelector("#modalPix div:nth-child(2)").innerHTML=o}catch(e){console.error(`[${new Date().toISOString()}] Erro em verMinhasChaves:`,e.message),document.querySelector("#modalPix div:nth-child(2)").innerHTML=`<p style="color:red;">${e.message}</p>`}})}function w(e){const a=document.getElementById("pixResultado");if(!a)return console.error(`[${new Date().toISOString()}] Elemento #pixResultado não encontrado`);a.innerHTML="";const o=document.createElement("div");Object.assign(o.style,{border:"2px solid #ff6600",borderRadius:"8px",padding:"15px",marginTop:"20px",backgroundColor:"#1e1e1e",color:"#fff",maxWidth:"400px"}),o.innerHTML=`
    <h3 style="margin-bottom: 10px;">Resumo da Transação Pix</h3>
    <p><strong>Enviado por:</strong> ${e.deUsuario||"Desconhecido"}</p>
    <p><strong>Recebido por:</strong> ${e.paraChave||"Desconhecido"}</p>
    <p><strong>Valor:</strong> R$ ${e.valor?.toFixed(2)||"0,00"}</p>
    ${e.descricao?`<p><strong>Descrição:</strong> ${e.descricao}</p>`:""}
    <p><strong>Data:</strong> ${e.data?new Date(e.data).toLocaleString():""}</p>
  `,a.appendChild(o)}document.addEventListener("DOMContentLoaded",()=>{const e=o=>document.getElementById(o);e("btnEnviar")?.addEventListener("click",m),e("btnReceber")?.addEventListener("click",u),e("btnAgendarPix")?.addEventListener("click",h),e("btnCobrarPix")?.addEventListener("click",x),e("btnLerQRCode")?.addEventListener("click",b),e("btnCopiarColar")?.addEventListener("click",v),e("btnMinhasChaves")?.addEventListener("click",f),e("btnCriarChaves")?.addEventListener("click",y);const a=window.fetch;window.fetch=async(...o)=>{const[r,t]=o;return r.includes("/api/pix/receber")&&(!t||t.method==="GET")&&console.warn(`[${new Date().toISOString()}] Requisição GET detectada para /api/pix/receber:`,o),a(...o)}});
