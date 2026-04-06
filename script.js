/* ══════════════════════════════════════════════════════
   LEAL FASHION — script.js  (API-connected version)
══════════════════════════════════════════════════════ */
const $=id=>document.getElementById(id);
const scene=$('scene'),overlay=$('overlay'),card=$('card');
const panelReg=$('panelReg'),panelLogin=$('panelLogin'),panelShop=$('panelShop');
const btnOpen=$('btnOpen'),btnLoginScene=$('btnLoginScene');
const btnClose=$('btnClose'),btnCloseLogin=$('btnCloseLogin');
const btnSub=$('btnSub'),btnLogin=$('btnLogin');
const goLogin=$('goLogin'),goCadastro=$('goCadastro');
const iNome=$('iNome'),iCep=$('iCep'),iTel=$('iTel'),iSenha=$('iSenha');
const lNome=$('lNome'),lSenha=$('lSenha');
const shopScroll=$('shopScroll'),prodGrid=$('prodGrid'),loadInd=$('loadInd');
const profileModal=$('profileModal'),pmBg=$('pmBg'),pmClose=$('pmClose'),btnLogout=$('btnLogout');
const prodModal=$('prodModal'),pdmBg=$('pdmBg'),pdmClose=$('pdmClose'),pdmHero=$('pdmHero'),pdmTag=$('pdmTag'),pdmName=$('pdmName'),pdmPrice=$('pdmPrice'),pdmDesc=$('pdmDesc'),pdmBtn=$('pdmBtn'),pdmBtnInner=$('pdmBtnInner');
const cartModal=$('cartModal'),cmBg=$('cmBg'),cmClose=$('cmClose'),cartBadge=$('cartBadge'),cartList=$('cartList'),cartEmpty=$('cartEmpty'),cFooter=$('cFooter'),cCount=$('cCount'),cTotal=$('cTotal'),checkoutBtn=$('checkoutBtn');
const btnCart=$('btnCart'),btnProfile=$('btnProfile'),btnOrders=$('btnOrders');
const payModal=$('payModal'),payBg=$('payBg'),payClose=$('payClose'),payBtn=$('payBtn'),payBtnInner=$('payBtnInner'),payTotalVal=$('payTotalVal'),payNormal=$('payNormal'),payOk=$('payOk'),payOkSub=$('payOkSub');
const ordersModal=$('ordersModal'),omBg=$('omBg'),omClose=$('omClose'),ordList=$('ordList'),ordEmpty=$('ordEmpty'),ordSub=$('ordSub');
const toast=$('toast');

/* ─── ESTADO ─── */
let userData={},cart=[],orders=[],currentProd=null,payMethod='Card',ordCounter=1000;
let authToken=localStorage.getItem('leal_token')||null;
let filtroAtual='Todos';
let page=0,loading=false,hasMore=true;
const BATCH=12;

/* ─── API BASE ─── */
const API = window.location.origin;

async function apiFetch(endpoint, options={}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  const res = await fetch(API + endpoint, { ...options, headers: { ...headers, ...(options.headers||{}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

/* ─── TOAST ─── */
function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2500); }

/* ─── PARTÍCULAS ─── */
function spawnP(ref,count,type){
  if(!ref) return;
  const r=ref.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const pal={click:['#4a90e2','#7850ff','#60a5fa','#818cf8','#38bdf8'],success:['#34d399','#6ee7b7','#4a90e2','#fbbf24','#a78bfa']};
  for(let i=0;i<count;i++)setTimeout(()=>{
    const p=document.createElement('div');p.className='particle';
    const sz=Math.random()>.55?4+Math.random()*4:2+Math.random()*2,col=pal[type][Math.floor(Math.random()*pal[type].length)];
    p.style.cssText=`width:${sz}px;height:${sz}px;background:${col};border-radius:${Math.random()>.4?'50%':'2px'};box-shadow:0 0 ${sz*2.5}px ${col};left:${cx-sz/2}px;top:${cy-sz/2}px;position:fixed;pointer-events:none;z-index:9999;`;
    document.body.appendChild(p);
    const a=Math.random()*2*Math.PI,sp=type==='success'?90+Math.random()*130:55+Math.random()*85;
    const x=Math.cos(a)*sp,y=Math.sin(a)*sp-(type==='success'?30:0),dur=550+Math.random()*500;
    p.animate([{transform:`translate(0,0) scale(1)`,opacity:1},{transform:`translate(${x}px,${y}px) rotate(${(Math.random()-.5)*720}deg) scale(0)`,opacity:0}],{duration:dur,easing:'cubic-bezier(0.22,0.61,0.36,1)',fill:'forwards'});
    setTimeout(()=>p.remove(),dur+50);
  },i*10);
}

function shake(el){ el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:320,easing:'ease'}); }

/* ═══════════════════════════════════════════════
   VITRINE
═══════════════════════════════════════════════ */
function enterShop(){
  card.classList.add('shop-mode');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    page=0; hasMore=true; prodGrid.innerHTML='';
    loadMoreProds(true);
    panelShop.classList.add('visible');
  }));
}

async function loadMoreProds(reset=false){
  if(loading||(!hasMore&&!reset)) return;
  if(reset){ page=0; hasMore=true; }
  loading=true;
  loadInd.style.display='flex';
  try {
    const tag = filtroAtual==='Todos'?'':filtroAtual;
    const prods = await apiFetch(`/api/produtos?tag=${encodeURIComponent(tag)}&page=${page}&limit=${BATCH}`);
    if(prods.length < BATCH) hasMore=false;
    renderProds(prods, !reset && page>0);
    page++;
  } catch(e) {
    /* fallback para catálogo local se API indisponível */
    const local = getLocalBatch();
    renderProds(local, !reset && page>0);
    page++;
  } finally {
    loading=false;
    loadInd.style.display='none';
  }
}

/* Catálogo local de fallback */
const localCatalog=[
  {emoji:'👟',nome:'Tênis Pro Run',preco_display:'R$ 349,90',preco_val:349.90,tag:'Esportes',descricao:'Tênis de alta performance para corridas urbanas.'},
  {emoji:'🚴',nome:'Capacete Bike',preco_display:'R$ 179,90',preco_val:179.90,tag:'Esportes',descricao:'22 ventilações, viseira magnética.'},
  {emoji:'🎧',nome:'Fone Bluetooth',preco_display:'R$ 189,90',preco_val:189.90,tag:'Eletrônicos',descricao:'Over-ear, cancelamento de ruído, 30h de bateria.'},
  {emoji:'⌚',nome:'Smartwatch X2',preco_display:'R$ 599,90',preco_val:599.90,tag:'Eletrônicos',descricao:'Monitor cardíaco, GPS, 7 dias de bateria.'},
  {emoji:'🎮',nome:'Controle Gamer',preco_display:'R$ 219,90',preco_val:219.90,tag:'Games',descricao:'Gatilhos adaptáveis, vibração háptica.'},
  {emoji:'👜',nome:'Bolsa Premium',preco_display:'R$ 279,90',preco_val:279.90,tag:'Moda',descricao:'Couro sintético premium, fechamento magnético.'},
  {emoji:'🧘',nome:'Tapete Yoga',preco_display:'R$ 119,90',preco_val:119.90,tag:'Fitness',descricao:'6mm TPE ecológico, antiderrapante.'},
  {emoji:'🏋️',nome:'Haltere 10kg',preco_display:'R$ 99,90',preco_val:99.90,tag:'Fitness',descricao:'Neoprene antiderrapante, núcleo ferro fundido.'},
  {emoji:'🧴',nome:'Kit Skincare',preco_display:'R$ 189,90',preco_val:189.90,tag:'Beleza',descricao:'Sérum vitamina C, hidratante FPS30, tônico.'},
  {emoji:'🛋️',nome:'Almofada Zen',preco_display:'R$ 59,90',preco_val:59.90,tag:'Casa',descricao:'45x45cm, veludo removível.'},
  {emoji:'☕',nome:'Cafeteira Elét.',preco_display:'R$ 229,90',preco_val:229.90,tag:'Cozinha',descricao:'1,5L programável, 12 xícaras.'},
  {emoji:'🏕️',nome:'Barraca 2p',preco_display:'R$ 499,90',preco_val:499.90,tag:'Aventura',descricao:'Impermeável 2000mm, montagem 5min.'},
];
function getLocalBatch(){
  const filtered = filtroAtual==='Todos'?localCatalog:localCatalog.filter(p=>p.tag===filtroAtual);
  if(!filtered.length) return [];
  const start = (page*BATCH)%filtered.length;
  return Array.from({length:BATCH},(_,i)=>({...filtered[(start+i)%filtered.length],_uid:Math.random().toString(36).slice(2)}));
}

function renderProds(items, append=false){
  if(!append) prodGrid.innerHTML='';
  const palettes=['linear-gradient(160deg,#F5EDE3 0%,#EDE3D6 100%)','linear-gradient(160deg,#F0EAE0 0%,#E8DDD0 100%)','linear-gradient(160deg,#F2EBE2 0%,#EAE0D3 100%)','linear-gradient(160deg,#EDE6DC 0%,#E5DAC8 100%)','linear-gradient(160deg,#F3EDE5 0%,#ECE3D5 100%)','linear-gradient(160deg,#EEE8DE 0%,#E6DBCC 100%)'];
  items.forEach((p,i)=>{
    const c=document.createElement('div');
    c.className='prod-card';
    c.style.animationDelay=(append?i*60:i*40)+'ms';
    const bg=palettes[i%palettes.length];
    /* normaliza campos da API vs local */
    const nome = p.nome||p.name||'';
    const preco = p.preco_display||p.price||'';
    const tag = p.tag||'';
    c.innerHTML=`<div class="prod-thumb" style="background:${bg}" data-tag="${tag}">${p.emoji||'📦'}</div><div class="prod-info"><div class="prod-name">${nome}</div><div class="prod-price">${preco}</div></div>`;
    c.addEventListener('click',()=>openProdModal({...p, name:nome, price:preco},bg));
    prodGrid.appendChild(c);
  });
}

shopScroll.addEventListener('scroll',()=>{
  const{scrollTop,scrollHeight,clientHeight}=shopScroll;
  if(scrollHeight-scrollTop-clientHeight<140&&!loading&&hasMore) loadMoreProds();
},{passive:true});

function openProdModal(p,bg){
  currentProd=p;
  pdmHero.style.background=bg||'#111827';
  const ex=pdmHero.querySelector('.pdm-emoji');if(ex)ex.remove();
  const em=document.createElement('div');em.className='pdm-emoji';em.style.cssText='font-size:76px;position:relative;z-index:2;';em.textContent=p.emoji||'📦';
  pdmHero.appendChild(em);
  pdmTag.textContent=p.tag||'';
  pdmName.textContent=p.nome||p.name||'';
  pdmPrice.textContent=p.preco_display||p.price||'';
  pdmDesc.textContent=p.descricao||p.desc||'';
  pdmBtn.classList.remove('adding','added');
  pdmBtnInner.innerHTML=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>Adicionar ao carrinho`;
  prodModal.classList.add('open');
}
pdmClose.addEventListener('click',()=>prodModal.classList.remove('open'));
pdmBg.addEventListener('click',()=>prodModal.classList.remove('open'));
pdmBtn.addEventListener('click',()=>{
  if(pdmBtn.classList.contains('adding')||pdmBtn.classList.contains('added'))return;
  pdmBtn.classList.add('adding');
  setTimeout(()=>{
    pdmBtn.classList.remove('adding');pdmBtn.classList.add('added');
    pdmBtnInner.innerHTML=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span style="color:#6ee7b7">Adicionado!</span>`;
    addToCart(currentProd);spawnP(pdmBtn,20,'success');
    setTimeout(()=>{prodModal.classList.remove('open');openCartModal();},700);
  },900);
});

/* ═══════════════════════════════════════════════
   NAVEGAÇÃO FORM
═══════════════════════════════════════════════ */
function showCard(which){
  overlay.classList.add('visible');
  if(which==='reg'){panelReg.style.display='block';panelLogin.style.display='none';}
  else{panelReg.style.display='none';panelLogin.style.display='block';}
}
btnOpen.addEventListener('click',()=>{spawnP(btnOpen,24,'click');showCard('reg');});
btnLoginScene.addEventListener('click',()=>{spawnP(btnLoginScene,24,'click');showCard('login');});
goLogin.addEventListener('click',()=>showCard('login'));
goCadastro.addEventListener('click',()=>showCard('reg'));

function closeOverlay(){
  panelShop.classList.remove('visible');
  overlay.classList.remove('visible');
  card.classList.remove('shop-mode');
  setTimeout(()=>{
    [iNome,iCep,iTel,iSenha,lNome,lSenha].forEach(e=>{if(e){e.value='';e.classList.remove('error');}});
    prodGrid.innerHTML=''; page=0; filtroAtual='Todos';
    const fl=$('filterLabel');if(fl)fl.textContent='Todos';
    panelReg.style.display='block';panelLogin.style.display='none';
  },400);
}
btnClose.addEventListener('click',closeOverlay);
btnCloseLogin.addEventListener('click',closeOverlay);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeOverlay();});

iCep.addEventListener('input',()=>{let v=iCep.value.replace(/\D/g,'').slice(0,8);if(v.length>5)v=v.slice(0,5)+'-'+v.slice(5);iCep.value=v;});
iTel.addEventListener('input',()=>{let v=iTel.value.replace(/\D/g,'').slice(0,9);if(v.length>5)v=v.slice(0,1)+' '+v.slice(1,5)+'-'+v.slice(5);else if(v.length>1)v=v.slice(0,1)+' '+v.slice(1);iTel.value=v;});

/* ─── CADASTRO ─── */
btnSub.addEventListener('click', async ()=>{
  const nome=iNome.value.trim(),cep=iCep.value.trim(),tel=iTel.value.trim(),senha=iSenha.value.trim();
  let ok=true;
  [iNome,iCep,iTel,iSenha].forEach(e=>e.classList.remove('error'));
  if(!nome){shake(iNome);iNome.classList.add('error');ok=false;}
  if(cep.length<9){shake(iCep);iCep.classList.add('error');ok=false;}
  if(tel.length<8){shake(iTel);iTel.classList.add('error');ok=false;}
  if(senha.length<4){shake(iSenha);iSenha.classList.add('error');ok=false;}
  if(!ok) return;

  btnSub.classList.add('loading'); spawnP(btnSub,30,'click');
  try {
    const data = await apiFetch('/api/clientes/cadastro', {
      method:'POST',
      body: JSON.stringify({ nome, cep, telefone: '(21) '+tel, senha })
    });
    authToken = data.token;
    localStorage.setItem('leal_token', authToken);
    userData = { id: data.cliente.id, nome: data.cliente.nome, cep: data.cliente.cep, tel: data.cliente.telefone };
    btnSub.classList.remove('loading');
    spawnP(card,55,'success');
    overlay.classList.remove('visible');
    setTimeout(()=>{ enterShop(); overlay.classList.add('visible'); },360);
  } catch(err) {
    btnSub.classList.remove('loading');
    showToast('❌ '+err.message);
    if(err.message.includes('Nome')) { shake(iNome); iNome.classList.add('error'); }
  }
});

/* ─── LOGIN ─── */
btnLogin.addEventListener('click', async ()=>{
  const nome=lNome.value.trim(),senha=lSenha.value.trim();
  let ok=true;
  [lNome,lSenha].forEach(e=>e.classList.remove('error'));
  if(!nome){shake(lNome);lNome.classList.add('error');ok=false;}
  if(!senha){shake(lSenha);lSenha.classList.add('error');ok=false;}
  if(!ok) return;

  btnLogin.classList.add('loading'); spawnP(btnLogin,30,'click');
  try {
    const data = await apiFetch('/api/clientes/login', {
      method:'POST',
      body: JSON.stringify({ nome, senha })
    });
    authToken = data.token;
    localStorage.setItem('leal_token', authToken);
    userData = { id: data.cliente.id, nome: data.cliente.nome, cep: data.cliente.cep, tel: data.cliente.telefone, foto_url: data.cliente.foto_url };
    btnLogin.classList.remove('loading');
    spawnP(card,55,'success');
    overlay.classList.remove('visible');
    setTimeout(()=>{ enterShop(); overlay.classList.add('visible'); },360);
  } catch(err) {
    btnLogin.classList.remove('loading');
    showToast('❌ '+err.message);
    shake(lSenha); lSenha.classList.add('error');
    if(err.message.includes('não encontrado')){ shake(lNome); lNome.classList.add('error'); }
  }
});

/* ─── LOGOUT ─── */
btnLogout.addEventListener('click',()=>{
  profileModal.classList.remove('open');
  authToken=null; localStorage.removeItem('leal_token');
  cart=[];orders=[];updateBadge();userData={};
  panelShop.classList.remove('visible');
  overlay.classList.remove('visible');
  card.classList.remove('shop-mode');
  prodGrid.innerHTML=''; page=0; filtroAtual='Todos';
  const fl=$('filterLabel');if(fl)fl.textContent='Todos';
  [lNome,lSenha,iNome,iCep,iTel,iSenha].forEach(e=>{if(e){e.value='';e.classList.remove('error');}});
  panelReg.style.display='block';panelLogin.style.display='none';
  spawnP(scene,35,'click');
  setTimeout(()=>showToast('👋 Até logo, volte sempre!'),400);
});

/* ─── PERFIL ─── */
const pmNameInput=$('pmNameInput'),pmCepInput=$('pmCepInput'),pmTelInput=$('pmTelInput');
const pmSave=$('pmSave'),pmUploadFoto=$('pmUploadFoto'),pmProfileImg=$('pmProfileImg');
const pmAvatar=document.querySelector('.pm-avatar');

btnProfile.addEventListener('click',e=>{
  e.stopPropagation();
  if(pmNameInput) pmNameInput.value=userData.nome||'';
  if(pmCepInput) pmCepInput.value=userData.cep||'';
  if(pmTelInput) pmTelInput.value=userData.tel||'';
  if(userData.foto_url&&pmProfileImg) pmProfileImg.src=userData.foto_url;
  profileModal.classList.add('open');
});
pmClose.addEventListener('click',()=>profileModal.classList.remove('open'));
pmBg.addEventListener('click',()=>profileModal.classList.remove('open'));

pmSave.addEventListener('click', async ()=>{
  try {
    const updated = await apiFetch('/api/clientes/perfil', {
      method:'PUT',
      body: JSON.stringify({ nome: pmNameInput.value, cep: pmCepInput.value, telefone: pmTelInput.value, foto_url: userData.foto_url||'' })
    });
    userData.nome=updated.nome; userData.cep=updated.cep; userData.tel=updated.telefone; userData.foto_url=updated.foto_url;
    showToast('✅ Perfil atualizado com sucesso!');
  } catch(err) {
    showToast('❌ '+err.message);
  }
});

if(pmAvatar) pmAvatar.addEventListener('click',()=>pmUploadFoto&&pmUploadFoto.click());
if(pmUploadFoto){
  pmUploadFoto.addEventListener('change',()=>{
    const file=pmUploadFoto.files[0];
    if(file){
      const reader=new FileReader();
      reader.onload=e=>{
        if(pmProfileImg) pmProfileImg.src=e.target.result;
        userData.foto_url=e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

/* ═══════════════════════════════════════════════
   CARRINHO
═══════════════════════════════════════════════ */
function addToCart(p){ const ex=cart.find(i=>(i.nome||i.name)===(p.nome||p.name)); if(ex)ex.qty++; else cart.push({...p,qty:1}); updateBadge(); }
function updateBadge(){ const t=cart.reduce((a,i)=>a+i.qty,0); cartBadge.textContent=t>9?'9+':t; t>0?cartBadge.classList.add('show'):cartBadge.classList.remove('show'); }
function openCartModal(){ renderCart(); cartModal.classList.add('open'); }

function renderCart(){
  cartList.innerHTML='';
  const total=cart.reduce((a,i)=>a+i.qty,0);
  cCount.textContent=total+' iten'+(total===1?'':'s');
  if(!cart.length){cartEmpty.style.display='block';cFooter.style.display='none';cartList.style.display='none';}
  else{
    cartEmpty.style.display='none';cFooter.style.display='block';cartList.style.display='block';
    cart.forEach((item,idx)=>{
      const d=document.createElement('div');d.className='cart-item';d.style.animationDelay=(idx*55)+'ms';
      const bg=`hsl(${[30,20,35,25,15,40][idx%6]},${20+idx%15}%,${88+idx%8}%)`;
      const nome=item.nome||item.name||'';
      const price=item.preco_display||item.price||'';
      d.innerHTML=`<div class="ci-thumb" style="background:${bg}">${item.emoji||'📦'}</div><div class="ci-info"><div class="ci-name">${nome}</div><div class="ci-price">${price}</div></div><div class="ci-qty"><button class="ci-qb" data-idx="${idx}" data-act="dec">−</button><span class="ci-qn">${item.qty}</span><button class="ci-qb" data-idx="${idx}" data-act="inc">+</button></div><button class="ci-rm" data-idx="${idx}">✕</button>`;
      cartList.appendChild(d);
    });
    cTotal.textContent='R$ '+cart.reduce((a,i)=>a+(i.preco_val||i.val||0)*i.qty,0).toFixed(2).replace('.',',');
  }
}
cartList.addEventListener('click',e=>{
  const qb=e.target.closest('.ci-qb'),rb=e.target.closest('.ci-rm');
  if(qb){const idx=+qb.dataset.idx;qb.dataset.act==='inc'?cart[idx].qty++:(--cart[idx].qty<=0&&cart.splice(idx,1));renderCart();updateBadge();}
  if(rb){cart.splice(+rb.dataset.idx,1);renderCart();updateBadge();}
});
btnCart.addEventListener('click',e=>{e.stopPropagation();openCartModal();});
cmClose.addEventListener('click',()=>cartModal.classList.remove('open'));
cmBg.addEventListener('click',()=>cartModal.classList.remove('open'));

/* ═══════════════════════════════════════════════
   PAGAMENTO
═══════════════════════════════════════════════ */
checkoutBtn.addEventListener('click',()=>{
  if(!cart.length) return;
  payTotalVal.textContent='R$ '+cart.reduce((a,i)=>a+(i.preco_val||i.val||0)*i.qty,0).toFixed(2).replace('.',',');
  payNormal.style.display='block';payOk.classList.remove('show','anim');payOk.style.display='none';
  payBtn.classList.remove('loading');
  payBtnInner.innerHTML=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Realizar pagamento`;
  $('ccNum').value='';$('ccHolder').value='';$('ccExp').value='';$('ccCvv').value='';
  $('ccNumP').textContent='•••• •••• •••• ••••';$('ccHolderP').textContent='Nome do titular';$('ccExpP').textContent='MM/AA';
  switchTab('Card');cartModal.classList.remove('open');payModal.classList.add('open');genBoleto();
});
payClose.addEventListener('click',()=>payModal.classList.remove('open'));
payBg.addEventListener('click',()=>payModal.classList.remove('open'));
document.querySelectorAll('.pay-tab').forEach(t=>t.addEventListener('click',()=>switchTab(t.dataset.tab)));

function switchTab(tab){
  payMethod=tab;
  document.querySelectorAll('.pay-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  document.querySelectorAll('.pay-panel').forEach(p=>p.classList.remove('active'));
  $('panel'+tab).classList.add('active');
  const lbl={Card:'Realizar pagamento',Pix:'Confirmar pagamento Pix',Boleto:'Gerar boleto'};
  payBtnInner.innerHTML=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>${lbl[tab]}`;
}
$('ccNum').addEventListener('input',e=>{let v=e.target.value.replace(/\D/g,'').slice(0,16);v=v.replace(/(.{4})/g,'$1 ').trim();e.target.value=v;$('ccNumP').textContent=v||'•••• •••• •••• ••••';});
$('ccHolder').addEventListener('input',e=>{$('ccHolderP').textContent=e.target.value||'Nome do titular';});
$('ccExp').addEventListener('input',e=>{let v=e.target.value.replace(/\D/g,'').slice(0,4);if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);e.target.value=v;$('ccExpP').textContent=v||'MM/AA';});
$('pixCopyBtn').addEventListener('click',()=>{navigator.clipboard?.writeText('loja@vitrine.com.br').catch(()=>{});const el=$('pixCopied');el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2000);});
function genBoleto(){const c=$('bltBars');if(!c)return;c.innerHTML='';const types=['t','m','s'];for(let i=0;i<40;i++){const b=document.createElement('div');b.className='blt-bar '+types[Math.floor(Math.random()*3)];c.appendChild(b);}}

payBtn.addEventListener('click', async ()=>{
  const rua=$('addrRua').value.trim(),numero=$('addrNumero').value.trim();
  const bairro=$('addrBairro').value.trim(),cidade=$('addrCidade').value.trim(),estado=$('addrEstado').value.trim();
  if(!rua||!numero||!bairro||!cidade||!estado){showToast('Preencha o endereço completo!');return;}

  payBtn.classList.add('loading');spawnP(payBtn,35,'success');
  const ml={Card:'Cartão de crédito',Pix:'Pix',Boleto:'Boleto bancário'};
  const totalVal = cart.reduce((a,i)=>a+(i.preco_val||i.val||0)*i.qty,0);
  const itens = cart.map(i=>({ nome:i.nome||i.name, emoji:i.emoji, qty:i.qty, price:i.preco_display||i.price, val:i.preco_val||i.val }));
  const statusPed = payMethod==='Boleto'?'pendente':'confirmado';

  try {
    /* Salva no banco se autenticado */
    let orderId = '#'+(++ordCounter);
    if(authToken) {
      const saved = await apiFetch('/api/vendas', {
        method:'POST',
        body: JSON.stringify({ total: totalVal, metodo_pagamento: ml[payMethod], status: statusPed, endereco:{rua,numero,bairro,cidade,estado}, itens })
      });
      orderId = '#'+saved.id;
    }

    const order = { id: orderId, date: new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}), items: itens, total: totalVal, method: ml[payMethod], status: statusPed, endereco:{rua,numero,bairro,cidade,estado} };
    orders.unshift(order); cart=[]; updateBadge();
    payBtn.classList.remove('loading');
    payNormal.style.display='none';
    payOkSub.textContent=`Pedido ${orderId} registrado 🎉`;
    payOk.style.display='flex';
    setTimeout(()=>payOk.classList.add('show','anim'),30);
    spawnP(payModal.querySelector('.sm-card'),50,'success');
    setTimeout(()=>{payModal.classList.remove('open');payOk.classList.remove('show','anim');},3000);
  } catch(err) {
    payBtn.classList.remove('loading');
    showToast('❌ '+err.message);
  }
});

/* ═══════════════════════════════════════════════
   COMPRAS (histórico local + API)
═══════════════════════════════════════════════ */
btnOrders.addEventListener('click', async e=>{
  e.stopPropagation();
  if(authToken){
    try {
      const apiOrders = await apiFetch('/api/vendas/minhas');
      orders = apiOrders.map(o=>({
        id:'#'+o.id, date:new Date(o.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),
        items: typeof o.itens==='string'?JSON.parse(o.itens):o.itens,
        total: parseFloat(o.total), method: o.metodo_pagamento,
        status: o.status==='confirmado'?'ok':'pend'
      }));
    } catch(e) { /* usa ordens locais */ }
  }
  renderOrders(); ordersModal.classList.add('open');
});
omClose.addEventListener('click',()=>ordersModal.classList.remove('open'));
omBg.addEventListener('click',()=>ordersModal.classList.remove('open'));

function renderOrders(){
  ordList.innerHTML='';ordSub.textContent=orders.length+' pedido'+(orders.length===1?'':'s');
  if(!orders.length){ordEmpty.style.display='block';ordList.style.display='none';return;}
  ordEmpty.style.display='none';ordList.style.display='block';
  orders.forEach((o,oi)=>{
    const w=document.createElement('div');w.className='ord-card';w.style.animationDelay=(oi*55)+'ms';
    const itens = Array.isArray(o.items)?o.items:[];
    const rows=itens.map(i=>`<div class="ord-irow"><div class="oi-em">${i.emoji||'📦'}</div><div class="oi-nm">${i.nome||i.name||''}</div><div class="oi-qt">x${i.qty}</div><div class="oi-pr">${i.price||i.preco_display||''}</div></div>`).join('');
    w.innerHTML=`<div class="ord-chdr" data-oi="${oi}"><div><div class="ord-id">${o.id}</div><div class="ord-date">${o.date}</div></div><div class="ord-right"><div class="ord-total">R$ ${o.total.toFixed(2).replace('.',',')}</div><div class="ord-badge ${o.status||'ok'}">${(o.status==='ok'||o.status==='confirmado')?'✓ Confirmado':'⏳ Aguardando'}</div></div></div><div class="ord-items" id="oi${oi}">${rows}<div class="ord-method"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>${o.method||''}</div></div>`;
    ordList.appendChild(w);
  });
}
ordList.addEventListener('click',e=>{const h=e.target.closest('.ord-chdr');if(h){$('oi'+h.dataset.oi).classList.toggle('open');}});

/* ═══════════════════════════════════════════════
   FILTRO
═══════════════════════════════════════════════ */
const btnFiltro=$('btnFiltro'),dropdown=$('filterDropdown'),filterLabel=$('filterLabel');
btnFiltro.addEventListener('click',e=>{e.stopPropagation();dropdown.style.display=dropdown.style.display==='block'?'none':'block';});
document.addEventListener('click',()=>{if(dropdown)dropdown.style.display='none';});
document.querySelectorAll('.filter-dropdown div').forEach(item=>{
  item.addEventListener('click',()=>{
    filtroAtual=item.dataset.filtro;
    if(filterLabel) filterLabel.textContent=filtroAtual;
    page=0; hasMore=true; prodGrid.innerHTML='';
    loadMoreProds(true);
    if(dropdown) dropdown.style.display='none';
  });
});

/* ═══════════════════════════════════════════════
   AUTO-LOGIN se token salvo
═══════════════════════════════════════════════ */
(async function checkSavedSession(){
  if(!authToken) return;
  /* valida token tentando carregar perfil */
  try {
    /* decodifica payload sem verificar (verificação é server-side) */
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    if(payload.exp && Date.now()/1000 > payload.exp){
      localStorage.removeItem('leal_token'); authToken=null; return;
    }
    userData = { id: payload.id, nome: payload.nome };
    /* token válido — vai direto para vitrine */
    card.classList.add('shop-mode');
    overlay.classList.add('visible');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      loadMoreProds(true);
      panelShop.classList.add('visible');
    }));
  } catch(e) {
    localStorage.removeItem('leal_token'); authToken=null;
  }
})();