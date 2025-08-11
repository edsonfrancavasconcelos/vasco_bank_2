import"./modulepreload-polyfill-B5Qt9EMX.js";document.addEventListener("DOMContentLoaded",()=>{const y={recarga:document.getElementById("secRecarga"),deposito:document.getElementById("secDeposito"),pagamento:document.getElementById("secPagamento"),transferencia:document.getElementById("secTransferencia")};function x(){Object.values(y).forEach(e=>e.style.display="none"),m()}function f(e,r,t){const n=document.getElementById("modalTransacao");n&&n.remove();const o=document.createElement("div");o.id="modalTransacao",Object.assign(o.style,{position:"fixed",top:"0",left:"0",width:"100vw",height:"100vh",backgroundColor:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"1000"}),o.innerHTML=`
      <div style="background:#1e1e1e; padding:20px; border-radius:12px; width:350px; max-width:90vw; color:white; font-family:'Segoe UI', sans-serif; position:relative;">
        <h2 style="color:#ff6600; margin-top:0;">${e}</h2>
        <div id="modalContent" style="margin-bottom:15px;">${r}</div>
        <div id="modalResumo" style="display:none; background:#262626; padding:10px; border-radius:8px; margin-bottom:15px;">
          <h3 style="color:#ff6600; margin:0 0 10px 0;">Resumo da Transação</h3>
          <div id="resumoConteudo"></div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button id="btnCancelar" style="background:#555; border:none; padding:8px 15px; border-radius:6px; color:#ddd; cursor:pointer;">Cancelar</button>
          <button id="btnConfirmar" style="background:#ff6600; border:none; padding:8px 15px; border-radius:6px; color:#fff; cursor:pointer;">Confirmar</button>
        </div>
      </div>
    `,document.body.appendChild(o),document.getElementById("btnCancelar").onclick=()=>m(),document.getElementById("btnConfirmar").onclick=async()=>{document.getElementById("btnConfirmar").disabled=!0,document.getElementById("btnCancelar").disabled=!0;try{const a=await t();document.getElementById("modalContent").style.display="none";const c=document.getElementById("modalResumo"),d=document.getElementById("resumoConteudo");d.innerHTML="";for(const[i,s]of Object.entries(a)){const p=i.charAt(0).toUpperCase()+i.slice(1).replace(/([A-Z])/g," $1");d.innerHTML+=`<p><strong>${p}:</strong> ${s}</p>`}c.style.display="block",setTimeout(()=>{m(),alert("✅ Transação realizada com sucesso!")},2e3)}catch(a){alert("Erro: "+(a.message||a)),document.getElementById("btnConfirmar").disabled=!1,document.getElementById("btnCancelar").disabled=!1}}}function m(){const e=document.getElementById("modalTransacao");e&&e.remove()}function l(e){let r="";switch(e){case"recarga":r=`
          <label>Operadora:<br/>
            <select id="inputOperadora" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;">
              <option value="">Selecione</option>
              <option value="Vivo">Vivo</option>
              <option value="Claro">Claro</option>
              <option value="TIM">TIM</option>
              <option value="Oi">Oi</option>
            </select>
          </label><br/><br/>
          <label>Número do Celular:<br/>
            <input id="inputNumeroCelular" type="tel" placeholder="(DDD) 9xxxx-xxxx" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label><br/><br/>
          <label>Valor:<br/>
            <input id="inputValor" type="number" min="0.01" step="0.01" placeholder="R$ 10,00" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label>
        `;break;case"deposito":r=`
          <label>Conta de Envio:<br/>
            <input id="inputContaOrigem" type="text" placeholder="Número da conta de envio" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
          </label><br/><br/>
          <label>Valor:<br/>
            <input id="inputValor" type="number" min="0.01" step="0.01" placeholder="R$ 100,00" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label>
        `;break;case"pagamento":r=`
          <label>Código de Barras:<br/>
            <input id="inputCodigoBoleto" type="text" placeholder="Digite o código de barras" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label><br/><br/>
          <label>Valor:<br/>
            <input id="inputValor" type="number" min="0.01" step="0.01" placeholder="R$ 0,00" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
          </label>
        `;break;case"transferencia":r=`
    <label>Conta de Envio:<br/>
      <input id="inputContaOrigem" type="text" placeholder="Número da conta de envio" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
    </label><br/><br/>  
    <label>Conta de Destino:<br/>
      <input id="inputContaDestino" type="text" placeholder="Número da conta destino ou chave Pix" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;" />
    </label><br/><br/>       
    <label>Valor:<br/>
      <input id="inputValor" type="number" min="0.01" step="0.01" placeholder="R$ 0,00" style="width:100%; padding:8px; margin-top:5px; border-radius:4px; border:none;"/>
    </label>
  `;break;default:alert("Tipo de transação inválido.");return}f(`Transação: ${e.charAt(0).toUpperCase()+e.slice(1)}`,r,async()=>{let t={};const n=document.getElementById("inputValor")?.value;if(!n||Number(n)<=0)throw alert("Informe um valor válido."),new Error("Valor inválido");const o=Number(n);switch(e){case"recarga":const i=document.getElementById("inputOperadora").value.trim(),s=document.getElementById("inputNumeroCelular").value.trim();if(!i)throw alert("Informe a operadora."),new Error("Operadora inválida");if(!s)throw alert("Informe o número do celular."),new Error("Número celular inválido");t={operador:i,numeroCelular:s,valorRecarga:o};break;case"deposito":const p=document.getElementById("inputContaOrigem").value.trim();if(!p)throw alert("Informe a conta de envio."),new Error("Conta origem inválida");t={contaOrigem:p,valorDeposito:o};break;case"pagamento":const u=document.getElementById("inputCodigoBoleto").value.trim();if(!u)throw alert("Informe o código de barras."),new Error("Código boleto inválido");t={codigoBoleto:u,valorBoleto:o};break;case"transferencia":const b=document.getElementById("inputContaOrigem").value.trim(),g=document.getElementById("inputContaDestino").value.trim();if(!b)throw alert("Informe a conta de envio."),new Error("Conta origem inválida");if(!g)throw alert("Informe a conta destino ou chave Pix."),new Error("Conta destino inválida");t={contaOrigem:b,contaDestino:g,valorTransferencia:o};break}const a=localStorage.getItem("token"),c=await fetch(`/api/transactions/${e}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify(t)}),d=await c.json();if(!c.ok)throw alert(`Erro: ${d.error||"Erro desconhecido"}`),new Error(d.error||"Erro desconhecido");return{Tipo:e.charAt(0).toUpperCase()+e.slice(1),Valor:`R$ ${o.toFixed(2)}`,...t}})}document.getElementById("btnRecarga").onclick=()=>l("recarga"),document.getElementById("btnDeposito").onclick=()=>l("deposito"),document.getElementById("btnPagamento").onclick=()=>l("pagamento"),document.getElementById("btnTransferencia").onclick=()=>l("transferencia"),x()});
