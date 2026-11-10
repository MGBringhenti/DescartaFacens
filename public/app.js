let data, currentUser, busy = false, historyFilter = 'descartes';
const main = document.querySelector('#main');
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => Number(value || 0).toLocaleString('pt-BR',{maximumFractionDigits:2});
const date = value => new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
const icons = {Plástico:'♧',Papel:'▤',Vidro:'♙',Metal:'◉'};
const user = () => data.usuarios.find(u=>u.id_usuario === currentUser);
const myDiscards = () => data.descartes.filter(d=>d.id_usuario === currentUser);
function toast(text) { const el=document.querySelector('#toast'); el.textContent=text; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),5000); }
async function api(path,body) {
 const response=await fetch('/api/'+path,body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {});
 const result=await response.json(); if(!response.ok) throw new Error(result.message); return result;
}
async function load() {
 try {
  data=await api('dados');
  if(!data.usuarios.length) throw new Error('Cadastre pelo menos um participante na tabela usuario para usar o protótipo.');
  currentUser=currentUser || data.usuarios[0].id_usuario;
  document.querySelector('#usuario').innerHTML=data.usuarios.map(u=>`<option value="${u.id_usuario}" ${u.id_usuario===currentUser?'selected':''}>${escape(u.nome)}</option>`).join('');
  render();
 } catch(error) { main.innerHTML=`<div class="error"><span class="eyebrow">CONEXÃO COM O BANCO</span><h1>Vamos conectar seu projeto.</h1><p>${escape(error.message)}</p><p>Configure as credenciais no arquivo <b>.env</b> e execute o SQL no banco <b>descartafacens</b>. O passo a passo está no README do projeto.</p><button class="primary" id="retry">Tentar novamente</button></div>`; document.querySelector('#retry').onclick=load; }
}
const heading=(tag,title,subtitle,action='')=>`<div class="page-heading"><div><span class="eyebrow">${tag}</span><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;
function activity(d) { return `<div class="activity"><span class="material-icon">${icons[d.material] || '♻'}</span><div><strong>${escape(d.material)} <span class="muted">· ${number(d.quantidade_kg)} kg</span></strong><small>${escape(d.ponto)} · ${date(d.data_descarte)}</small></div><span class="earned">+${number(d.pontos)} pts</span></div>`; }
function home() {
 const discards=myDiscards(), kg=discards.reduce((s,d)=>s+Number(d.quantidade_kg),0);
 return heading('CADA DESCARTE CONTA',`Olá, ${escape(user().nome.split(' ')[0])} <span class="green">☀</span>`,'Seu próximo passo por um futuro mais sustentável.',`<a class="primary" href="#descartar">＋ Registrar descarte</a>`)+
 `<section class="hero"><div><span class="eyebrow">BOM PARA VOCÊ. MELHOR PARA O PLANETA.</span><h2>Transforme resíduos<br>em novas possibilidades.</h2><p>Descarte no lugar certo, acumule pontos e aproveite recompensas de parceiros locais.</p><a href="#recompensas" class="primary">Explorar recompensas <span>↗</span></a></div><div class="cycle-art" aria-hidden="true"><span>♻</span></div></section>
 <section class="stats"><div class="stat"><div class="stat-label">Seus pontos <span>✧</span></div><div class="stat-value">${number(user().saldo_pontos)} <small>pts</small></div><small>Disponíveis para novas trocas</small></div><div class="stat"><div class="stat-label">Material reciclado <span>♻</span></div><div class="stat-value">${number(kg)} <small>kg</small></div><small>Resíduos com o destino certo</small></div><div class="stat"><div class="stat-label">Descartes realizados <span>↗</span></div><div class="stat-value">${discards.length.toString().padStart(2,'0')}</div><small>Atitudes que fazem a diferença</small></div></section>
 <div class="columns"><section class="panel"><div class="section-head"><h2>Seus últimos descartes</h2><a class="text-link" href="#historico">Ver todos ↗</a></div>${discards.slice(0,3).map(activity).join('')||'<p class="empty">Seu primeiro descarte começa uma nova história.</p>'}</section><section class="panel tip"><span class="eyebrow">RECICLAR COMEÇA EM CASA</span><h3>Separe hoje.<br>Transforme amanhã.</h3><p>Limpe as embalagens e mantenha papel e papelão secos. Pequenos cuidados ajudam todo o processo de reciclagem.</p><a class="text-link" href="#pontos">Encontre um ponto de coleta ↗</a></section></div>`;
}
function discardPage() {
 return heading('UM NOVO DESTINO','Registrar descarte','Informe o material e o peso para somar pontos à sua jornada.')+`<div class="form-grid"><form id="discard-form" class="panel"><h2>O que vamos reciclar hoje?</h2><div class="field"><label for="material">Material</label><select id="material" name="id_material" required><option value="">Selecione o material</option>${data.materiais.map(m=>`<option value="${m.id_material}">${escape(m.nome)} · ${m.pontos_kg} pontos/kg</option>`).join('')}</select><small id="material-tip" class="instructions">Escolha o material para ver as orientações.</small></div><div class="field"><label for="peso">Quantidade em quilogramas</label><input id="peso" name="quantidade_kg" type="number" min="0.01" max="10000" step="0.01" placeholder="Ex.: 2,50" required></div><div class="field"><label for="ponto">Ponto de coleta</label><select id="ponto" name="id_ponto" required><option value="">Selecione onde foi feito o descarte</option>${data.pontos.map(p=>`<option value="${p.id_ponto}">${escape(p.nome)}</option>`).join('')}</select></div><div class="estimate"><small>Você vai receber</small><strong id="estimate">0 pontos</strong><small>Peso × pontos por kg. Frações de ponto são arredondadas para baixo.</small></div><button class="primary" type="submit">♻ Confirmar descarte</button></form><aside class="panel"><span class="eyebrow">COMO FUNCIONA</span><h2>Um gesto. Um novo ciclo.</h2><ol class="steps"><li>Separe os materiais recicláveis.</li><li>Leve até um ponto de coleta.</li><li>Registre o peso de cada material.</li><li>Troque seus pontos por recompensas.</li></ol><p class="instructions">O descarte será registrado para <b>${escape(user().nome)}</b>, com a data e o horário atuais.</p><p class="instructions">Neste protótipo, o peso é informado manualmente para demonstrar o funcionamento do projeto.</p></aside></div>`;
}
function rewardsPage() {
 return heading('SUA ATITUDE VALE MAIS','Recompensas',`Você tem ${number(user().saldo_pontos)} pontos disponíveis para trocar.`)+`<div class="grid">${data.recompensas.map((r,i)=>{
 const enough=Number(user().saldo_pontos)>=r.custo_pontos, stock=r.quantidade_disponivel>0;
 return `<article class="reward"><div class="reward-art" aria-hidden="true">${['♧','▣','☕'][i%3]}</div><div class="reward-body"><span class="eyebrow">${escape(r.parceiro)}</span><h3>${escape(r.nome)}</h3><p>${escape(r.descricao)}</p><div class="reward-meta"><span class="points">${number(r.custo_pontos)} <small>pts</small></span><small>${r.quantidade_disponivel} disponíveis</small></div><button class="primary" data-reward="${r.id_recompensa}" ${!enough||!stock?'disabled':''}>${!stock?'Esgotado':!enough?`Faltam ${number(r.custo_pontos-user().saldo_pontos)} pontos`:'Resgatar recompensa'}</button></div></article>`;
 }).join('') || '<p class="empty">Nenhuma recompensa disponível no momento.</p>'}</div>`;
}
function collectionPage() {
 return heading('PERTO DE VOCÊ','Pontos de coleta','Encontre um destino para seus materiais recicláveis.')+`<div class="grid">${data.pontos.map((p,i)=>`<article class="location"><span class="number">◎ PONTO ${String(i+1).padStart(2,'0')}</span><h3>${escape(p.nome)}</h3><p>${escape(p.endereco)}</p><small>◷ ${escape(p.horario_funcionamento || 'Consulte o local')}</small><br><a class="secondary" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.latitude!=null&&p.longitude!=null?`${p.latitude},${p.longitude}`:p.endereco)}">Ver localização ↗</a></article>`).join('')||'<p class="empty">Nenhum ponto ativo cadastrado.</p>'}</div><p class="instructions">Os pontos do banco inicial são fictícios e usados apenas na apresentação do projeto.</p>`;
}
function historyPage() {
 const isDiscard=historyFilter==='descartes'; const records=isDiscard?myDiscards():data.resgates.filter(r=>r.id_usuario===currentUser);
 return heading('SUA JORNADA','Meu histórico','Acompanhe seus descartes e as recompensas que já resgatou.')+`<div class="filters"><button data-filter="descartes" class="${isDiscard?'active':''}">Descartes</button><button data-filter="resgates" class="${!isDiscard?'active':''}">Resgates</button></div><section class="panel"><div class="table-wrap"><table><thead><tr>${(isDiscard?['Data e horário','Material','Ponto de coleta','Peso','Pontos calculados']:['Data e horário','Recompensa','Pontos utilizados']).map(t=>`<th scope="col">${t}</th>`).join('')}</tr></thead><tbody>${records.map(r=>isDiscard?`<tr><td>${date(r.data_descarte)}</td><td>${escape(r.material)}</td><td>${escape(r.ponto)}</td><td>${number(r.quantidade_kg)} kg</td><td class="green">+${number(r.pontos)}</td></tr>`:`<tr><td>${date(r.data_resgate)}</td><td>${escape(r.recompensa)}</td><td>−${number(r.pontos_utilizados)}</td></tr>`).join('')}</tbody></table>${!records.length?'<p class="empty">Nenhum registro por aqui ainda.</p>':''}</div></section>${isDiscard?'<p class="instructions">Os pontos do histórico são calculados usando a pontuação atual de cada material.</p>':''}`;
}
function render() {
 if(!data || !user()) return;
 const page=location.hash.slice(1)||'inicio';
 document.querySelectorAll('nav a').forEach(a=>{a.classList.toggle('active',a.dataset.page===page);if(a.dataset.page===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 main.innerHTML=({inicio:home,descartar:discardPage,recompensas:rewardsPage,pontos:collectionPage,historico:historyPage}[page]||home)();
 const form=document.querySelector('#discard-form');
 if(form) {
  form.oninput=()=>{const m=data.materiais.find(m=>m.id_material===Number(form.id_material.value));const weight=Math.max(0,Number(form.quantidade_kg.value)||0);document.querySelector('#estimate').textContent=number(Math.floor((Math.round(weight*100)*(m?.pontos_kg||0))/100))+' pontos';document.querySelector('#material-tip').textContent=m?.instrucoes_descarte||'Escolha o material para ver as orientações.';};
  form.onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;const button=form.querySelector('button');button.disabled=true;try{const result=await api('descartes',{...Object.fromEntries(new FormData(form)),id_usuario:currentUser});toast(`${result.message} +${result.pontos} pontos.`);location.hash='historico';await load();}catch(error){toast(error.message);}finally{busy=false;button.disabled=false;}};
 }
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{historyFilter=b.dataset.filter;render();});
 document.querySelectorAll('[data-reward]').forEach(b=>b.onclick=()=>confirmReward(Number(b.dataset.reward)));
}
function confirmReward(id) {
 const r=data.recompensas.find(r=>r.id_recompensa===id),dialog=document.querySelector('#confirm'), participant=currentUser;
 document.querySelector('#confirm-text').textContent=`${r.nome} por ${number(r.custo_pontos)} pontos para ${user().nome}. O valor será descontado do saldo.`;
 dialog.returnValue='';dialog.showModal();
 dialog.onclose=async()=>{if(dialog.returnValue!=='confirm'||busy)return;busy=true;document.querySelectorAll('[data-reward]').forEach(b=>b.disabled=true);try{const result=await api('resgates',{id_usuario:participant,id_recompensa:id});toast(result.message);await load();}catch(error){toast(error.message);render();}finally{busy=false;}};
}
document.querySelector('#usuario').onchange=e=>{currentUser=Number(e.target.value);render();};
window.addEventListener('hashchange',render);
load();
