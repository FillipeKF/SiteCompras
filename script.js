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

let userData={},cart=[],orders=[],currentProd=null,payMethod='Card',ordCounter=1000;
let filtroAtual='Todos';
const userDB={};

/* ══════════════════════════════════════════════
   CATÁLOGO — 99 PRODUTOS
══════════════════════════════════════════════ */
const catalog=[
  {emoji:'👟',name:'Tênis Pro Run',price:'R$ 349,90',val:349.90,tag:'Esportes',desc:'Tênis de alta performance para corridas urbanas. Solado EVA, cabedal respirável.'},
  {emoji:'🚴',name:'Capacete Bike',price:'R$ 179,90',val:179.90,tag:'Esportes',desc:'22 ventilações, viseira magnética, ajuste micro-ratchet, 280g.'},
  {emoji:'🏊',name:'Óculos Natação',price:'R$ 89,90',val:89.90,tag:'Esportes',desc:'Lentes anti-UV, vedação de silicone, ajuste fácil. Ideal para piscina e mar.'},
  {emoji:'⚽',name:'Bola Society',price:'R$ 119,90',val:119.90,tag:'Esportes',desc:'Termotecida, 32 gomos, costura reforçada. Oficial tamanho 5.'},
  {emoji:'🏀',name:'Bola Basquete',price:'R$ 149,90',val:149.90,tag:'Esportes',desc:'Borracha vulcanizada, grip superior, tamanho 7 oficial NBA.'},
  {emoji:'🎾',name:'Raquete Tennis',price:'R$ 289,90',val:289.90,tag:'Esportes',desc:'Liga alumínio, 270g, encordoamento 16x19. Ideal para iniciantes.'},
  {emoji:'🥊',name:'Luvas Boxe',price:'R$ 159,90',val:159.90,tag:'Esportes',desc:'Couro sintético premium, espuma dupla, fechamento velcro. 12oz.'},
  {emoji:'🏃',name:'Bermuda Runner',price:'R$ 99,90',val:99.90,tag:'Esportes',desc:'Dry-fit, bolso traseiro zipado, refletivo noturno, elastano 10%.'},
  {emoji:'🏋️',name:'Haltere 10kg',price:'R$ 99,90',val:99.90,tag:'Fitness',desc:'Neoprene antiderrapante, núcleo ferro fundido para treinos em casa.'},
  {emoji:'🧘',name:'Tapete Yoga',price:'R$ 119,90',val:119.90,tag:'Fitness',desc:'6mm TPE ecológico, antiderrapante, alinhamento guia, 183x61cm.'},
  {emoji:'💪',name:'Elástico Treino',price:'R$ 49,90',val:49.90,tag:'Fitness',desc:'Kit 5 faixas de resistência progressiva, látex natural, bolsa inclusa.'},
  {emoji:'⚖️',name:'Balança Smart',price:'R$ 139,90',val:139.90,tag:'Fitness',desc:'IMC, gordura, massa muscular, app Bluetooth. Vidro temperado.'},
  {emoji:'🧲',name:'Barra Fixação',price:'R$ 129,90',val:129.90,tag:'Fitness',desc:'Encaixa em portas 60-90cm, suporta 120kg, sem furos, 3 pegas.'},
  {emoji:'🪢',name:'Corda Pular',price:'R$ 59,90',val:59.90,tag:'Fitness',desc:'Rolamento em aço, cabo PVC ajustável, alças ergonômicas.'},
  {emoji:'🏅',name:'Cinturão Treino',price:'R$ 89,90',val:89.90,tag:'Fitness',desc:'Couro nubuck, largura 10cm, duplo velcro e fivela, powerlifting.'},
  {emoji:'🥗',name:'Shaker 700ml',price:'R$ 44,90',val:44.90,tag:'Fitness',desc:'Tritan livre de BPA, tela misturadora inox, tampa rosca, 700ml.'},
  {emoji:'🎧',name:'Fone Bluetooth',price:'R$ 189,90',val:189.90,tag:'Eletrônicos',desc:'Fone over-ear, cancelamento de ruído, 30h de bateria e Bluetooth 5.3.'},
  {emoji:'⌚',name:'Smartwatch X2',price:'R$ 599,90',val:599.90,tag:'Eletrônicos',desc:'Monitor cardíaco, GPS, 7 dias de bateria, 100+ modos esportivos.'},
  {emoji:'🎵',name:'Caixinha JBL',price:'R$ 299,90',val:299.90,tag:'Eletrônicos',desc:"IPX7 à prova d'água, 20h de bateria, graves potentes."},
  {emoji:'🖱️',name:'Mouse Gamer',price:'R$ 169,90',val:169.90,tag:'Eletrônicos',desc:'16000 DPI, RGB, 8 botões programáveis, sensor óptico Pixart.'},
  {emoji:'⌨️',name:'Teclado Mecânico',price:'R$ 349,90',val:349.90,tag:'Eletrônicos',desc:'Switches Blue, ABNT2, RGB por tecla, construção alumínio.'},
  {emoji:'📷',name:'Ring Light 26cm',price:'R$ 149,90',val:149.90,tag:'Eletrônicos',desc:'3 tonalidades, dimmer 10 níveis, suporte celular, tripé 1,7m.'},
  {emoji:'🔌',name:'Hub USB-C 7x1',price:'R$ 119,90',val:119.90,tag:'Eletrônicos',desc:'HDMI 4K, 2x USB-A, 2x USB-C, leitor SD, entrega 100W.'},
  {emoji:'🔋',name:'Power Bank 20k',price:'R$ 189,90',val:189.90,tag:'Eletrônicos',desc:'20000mAh, carregamento rápido 22,5W, 3 saídas, display LED.'},
  {emoji:'📡',name:'Roteador Wi-Fi 6',price:'R$ 449,90',val:449.90,tag:'Eletrônicos',desc:'AX1800, dual-band, 4 antenas, alcance 200m², MU-MIMO.'},
  {emoji:'🎙️',name:'Microfone USB',price:'R$ 229,90',val:229.90,tag:'Eletrônicos',desc:'Condensador cardioide, 192kHz/24bit, braço articulado incluso.'},
  {emoji:'💻',name:'Suporte Notebook',price:'R$ 129,90',val:129.90,tag:'Eletrônicos',desc:'Alumínio 7 ângulos, ventilação térmica, dobra flat, universal 10-17".'},
  {emoji:'🖨️',name:'Cabo HDMI 2.1',price:'R$ 59,90',val:59.90,tag:'Eletrônicos',desc:'4K 120fps, 8K 60fps, 2m, nylon trançado, conectores banhados ouro.'},
  {emoji:'💾',name:'SSD Externo 1TB',price:'R$ 399,90',val:399.90,tag:'Eletrônicos',desc:'USB-C 3.2 Gen2, leitura 1050MB/s, IP55, compacto 51g.'},
  {emoji:'🖥️',name:'Webcam Full HD',price:'R$ 199,90',val:199.90,tag:'Eletrônicos',desc:'1080p 30fps, microfone duplo, plug-and-play, campo 90°.'},
  {emoji:'🎮',name:'Controle Gamer',price:'R$ 219,90',val:219.90,tag:'Games',desc:'Gatilhos adaptáveis, vibração háptica, 20h de bateria. PC e mobile.'},
  {emoji:'🕹️',name:'Joystick Arcade',price:'R$ 179,90',val:179.90,tag:'Games',desc:'Botões Sanwa, acrílico customizável, USB-C, PC/PS4/Switch.'},
  {emoji:'🖥️',name:'Monitor 24" 165Hz',price:'R$ 1299,90',val:1299.90,tag:'Games',desc:'IPS Full HD, 1ms, FreeSync Premium, HDR400, bordas mínimas.'},
  {emoji:'🎯',name:'MousePad XL',price:'R$ 79,90',val:79.90,tag:'Games',desc:'90x40cm, base borracha antiderrapante, superfície speed tecido.'},
  {emoji:'🎲',name:'Card Captura',price:'R$ 349,90',val:349.90,tag:'Games',desc:'4K 30fps passthrough, USB-C, streaming OBS/XSplit.'},
  {emoji:'🔊',name:'Headset 7.1',price:'R$ 279,90',val:279.90,tag:'Games',desc:'Surround virtual 7.1, drivers 50mm, cancelamento ruído, USB.'},
  {emoji:'👜',name:'Bolsa Premium',price:'R$ 279,90',val:279.90,tag:'Moda',desc:'Couro sintético premium, forro interno, compartimentos e fechamento magnético.'},
  {emoji:'👔',name:'Camisa Social',price:'R$ 159,90',val:159.90,tag:'Moda',desc:'Slim fit algodão premium, antirrugas, corte moderno e costura reforçada.'},
  {emoji:'👗',name:'Vestido Midi',price:'R$ 219,90',val:219.90,tag:'Moda',desc:'Viscose fluida, estampa floral exclusiva, decote V ajustável.'},
  {emoji:'🧥',name:'Jaqueta Jeans',price:'R$ 249,90',val:249.90,tag:'Moda',desc:'100% algodão stonewashed, botões de metal, corte oversized.'},
  {emoji:'👖',name:'Calça Cargo',price:'R$ 189,90',val:189.90,tag:'Moda',desc:'Ripstop resistente, 6 bolsos, cintura ajustável, caimento relaxado.'},
  {emoji:'🧣',name:'Cachecol Cashmere',price:'R$ 129,90',val:129.90,tag:'Moda',desc:'30% cashmere 70% lã, 190x30cm, 12 cores, macio e quente.'},
  {emoji:'🧤',name:'Luvas Couro',price:'R$ 89,90',val:89.90,tag:'Moda',desc:'Couro legítimo, forro lã, touchscreen compatível, costuras à vista.'},
  {emoji:'👒',name:'Chapéu Bucket',price:'R$ 69,90',val:69.90,tag:'Moda',desc:'Algodão twill, aba estruturada, cinta interna ajustável, unissex.'},
  {emoji:'🧦',name:'Kit Meias 6 Pares',price:'R$ 59,90',val:59.90,tag:'Moda',desc:'Algodão penteado, reforço no calcanhar, box individual, antimicrobiano.'},
  {emoji:'🕶️',name:'Óculos UV400',price:'R$ 129,90',val:129.90,tag:'Acessórios',desc:'Proteção UV400, lentes polarizadas anti-reflexo, armação acetato leve.'},
  {emoji:'📱',name:'Capa iPhone',price:'R$ 49,90',val:49.90,tag:'Acessórios',desc:'Silicone líquido, bordas elevadas para câmera. 12 cores disponíveis.'},
  {emoji:'💼',name:'Mochila Work',price:'R$ 239,90',val:239.90,tag:'Acessórios',desc:'Notebook 15", USB externo, impermeável, anti-furto, 30L.'},
  {emoji:'⌚',name:'Relógio Analógico',price:'R$ 299,90',val:299.90,tag:'Acessórios',desc:'Pulseira couro, caixa inox 42mm, mecanismo japonês, 5ATM.'},
  {emoji:'💍',name:'Pulseira Prata',price:'R$ 149,90',val:149.90,tag:'Acessórios',desc:'Prata 925, banho ouro 18k, fecho borboleta, largura 6mm.'},
  {emoji:'🎒',name:'Mochila Trilha',price:'R$ 319,90',val:319.90,tag:'Acessórios',desc:'45L, hidratação, ripstop resistente, capa de chuva incluída.'},
  {emoji:'👝',name:'Pochete Tática',price:'R$ 89,90',val:89.90,tag:'Acessórios',desc:'Nylon 1000D, 3 bolsos, alça ajustável, molle compatível.'},
  {emoji:'🔑',name:'Porta-Chaves',price:'R$ 39,90',val:39.90,tag:'Acessórios',desc:'Alumínio anodizado, organiza até 12 chaves, sem barulho.'},
  {emoji:'📲',name:'Suporte Celular Car',price:'R$ 49,90',val:49.90,tag:'Acessórios',desc:'Magnético, ventilação/CD, rotação 360°, compatível com todos.'},
  {emoji:'🛋️',name:'Almofada Zen',price:'R$ 59,90',val:59.90,tag:'Casa',desc:'45x45cm, veludo removível, 8 cores. Fibra siliconada premium.'},
  {emoji:'🕯️',name:'Vela Aromática',price:'R$ 79,90',val:79.90,tag:'Casa',desc:'Cera soja 100%, pavio algodão, 50h queima, notas sândalo e baunilha.'},
  {emoji:'🪴',name:'Vaso Cerâmica',price:'R$ 89,90',val:89.90,tag:'Casa',desc:'Cerâmica vitrificada, 20cm, acabamento matte, prato incluso.'},
  {emoji:'🛁',name:'Kit Banho',price:'R$ 119,90',val:119.90,tag:'Casa',desc:'Saboneteira + porta-escova + dispenser 300ml, bambu sustentável.'},
  {emoji:'🪞',name:'Moldura Espelho',price:'R$ 149,90',val:149.90,tag:'Casa',desc:'MDF laqueado, 40x50cm, gancho traseiro, 5 cores disponíveis.'},
  {emoji:'💡',name:'Lâmpada Smart',price:'R$ 69,90',val:69.90,tag:'Casa',desc:'Wi-Fi 16M cores, compatível Alexa/Google, base E27, 10W=75W.'},
  {emoji:'🧺',name:'Organizador Malha',price:'R$ 49,90',val:49.90,tag:'Casa',desc:'Set 3 tamanhos, polipropileno dobrável, alças reforçadas.'},
  {emoji:'🪑',name:'Almofada Cadeira',price:'R$ 69,90',val:69.90,tag:'Casa',desc:'Memory foam 5cm, capa lavável, antiderrapante, ergonômica.'},
  {emoji:'🏡',name:'Difusor Bambu',price:'R$ 99,90',val:99.90,tag:'Casa',desc:'200ml, 12 palitos bambu, temporizador 3h, 7 LEDs ambientes.'},
  {emoji:'🧴',name:'Kit Skincare',price:'R$ 189,90',val:189.90,tag:'Beleza',desc:'Sérum vitamina C, hidratante FPS30, tônico. Vegano, sem parabenos.'},
  {emoji:'💄',name:'Batom Matte',price:'R$ 49,90',val:49.90,tag:'Beleza',desc:'18h duração, fórmula transfer-proof, 24 tons, vitamina E.'},
  {emoji:'🪥',name:'Escova Elétrica',price:'R$ 159,90',val:159.90,tag:'Beleza',desc:'Sônica 31000 movimentos/min, 3 modos, timer 2min, USB.'},
  {emoji:'✂️',name:'Kit Barba',price:'R$ 129,90',val:129.90,tag:'Beleza',desc:'Barbeador + aparador + tesoura + pente + estojo. Inox premium.'},
  {emoji:'💅',name:'Esmalte Gel',price:'R$ 34,90',val:34.90,tag:'Beleza',desc:'Secagem LED 60s, 3 semanas de duração, 40 cores, sem odor.'},
  {emoji:'🧖',name:'Máscara Facial',price:'R$ 79,90',val:79.90,tag:'Beleza',desc:'Argila caulim, carvão ativado, 100g. Remove poros e oleosidade.'},
  {emoji:'🌸',name:'Perfume 100ml',price:'R$ 259,90',val:259.90,tag:'Beleza',desc:'Eau de Parfum, notas floral e amadeirado, duração 8h, importado.'},
  {emoji:'☕',name:'Cafeteira Elét.',price:'R$ 229,90',val:229.90,tag:'Cozinha',desc:'1,5L programável, filtro permanente, 12 xícaras em 8 min.'},
  {emoji:'🍳',name:'Frigideira 28cm',price:'R$ 159,90',val:159.90,tag:'Cozinha',desc:'Antiaderente PFOA-free, cabo silicone, indução compatível, 5 camadas.'},
  {emoji:'🥣',name:'Mixer Portátil',price:'R$ 119,90',val:119.90,tag:'Cozinha',desc:'700W, 2 velocidades, copo medidor, lâmina inox. Desmontável.'},
  {emoji:'🧊',name:'Forma de Gelo',price:'R$ 39,90',val:39.90,tag:'Cozinha',desc:'Silicone alimentício, 15 esferas 4cm, tampa hermética.'},
  {emoji:'🍶',name:'Garrafa Térmica',price:'R$ 89,90',val:89.90,tag:'Cozinha',desc:'500ml inox dupla parede, 12h quente 24h frio, boca larga.'},
  {emoji:'🔪',name:'Faca Chef 20cm',price:'R$ 149,90',val:149.90,tag:'Cozinha',desc:'Aço inox alemão 1.4116, cabo pakkawood, equilíbrio perfeito.'},
  {emoji:'⚗️',name:'Conjunto Tempero',price:'R$ 69,90',val:69.90,tag:'Cozinha',desc:'8 potes vidro hermético, suporte bambu giratório, etiquetas.'},
  {emoji:'🎂',name:'Forma Antiader.',price:'R$ 59,90',val:59.90,tag:'Cozinha',desc:'Kit 3 tamanhos redondas, revestimento duplo, libera fácil.'},
  {emoji:'🏕️',name:'Barraca 2p',price:'R$ 499,90',val:499.90,tag:'Aventura',desc:'Fibra de vidro, impermeável 2000mm, 3 estações, montagem 5min.'},
  {emoji:'🔦',name:'Lanterna Tática',price:'R$ 89,90',val:89.90,tag:'Aventura',desc:'1200 lúmens, 5 modos, zoom, IPX6, bateria 18650 inclusa.'},
  {emoji:'🗺️',name:'Bússola Silva',price:'R$ 119,90',val:119.90,tag:'Aventura',desc:'Líquida, espelho de sinalização, régua escala, cordão nylon.'},
  {emoji:'🪓',name:'Canivete Multi',price:'R$ 179,90',val:179.90,tag:'Aventura',desc:'18 funções, aço inox, cabo alumínio, inclui serrilhado e alicate.'},
  {emoji:'🩺',name:'Kit Primeiros Soc.',price:'R$ 129,90',val:129.90,tag:'Aventura',desc:'55 itens, bolsa impermeável, manual, torniquete, curativo avançado.'},
  {emoji:'🎨',name:'Kit Aquarela',price:'R$ 139,90',val:139.90,tag:'Arte',desc:'36 cores, 3 pincéis, 2 blocos papel 300g, paleta de mistura.'},
  {emoji:'✏️',name:'Set Lápis Artist',price:'R$ 89,90',val:89.90,tag:'Arte',desc:'72 lápis de cor profissional, mina oleosa, estojo enrolável.'},
  {emoji:'🖌️',name:'Tela Canvas 40x60',price:'R$ 69,90',val:69.90,tag:'Arte',desc:'100% algodão dupla camada, chassi pinheiro, pack 3 unidades.'},
  {emoji:'📐',name:'Mesa Luz A3',price:'R$ 199,90',val:199.90,tag:'Arte',desc:'LED ajustável 5 níveis, USB, ultrafina 5mm, 5000K homogêneo.'},
  {emoji:'🖊️',name:'Caneta Posca 15cx',price:'R$ 119,90',val:119.90,tag:'Arte',desc:'15 cores, ponta 1,8mm, tinta acrílica opaca, multi-superfície.'},
  {emoji:'📚',name:'Fichário A4 Premium',price:'R$ 49,90',val:49.90,tag:'Escritório',desc:'Capa dura PVC, 4 argolas 40mm, lombada impressa, 500 folhas.'},
  {emoji:'🖊️',name:'Caneta Pilot G2',price:'R$ 29,90',val:29.90,tag:'Escritório',desc:'Pack 12 unidades, gel 0,7mm, grip emborrachado, 6 cores.'},
  {emoji:'📎',name:'Grampeador Metal',price:'R$ 59,90',val:59.90,tag:'Escritório',desc:'Capacidade 30 folhas, inox polido, grampos 26/6 e 24/6.'},
  {emoji:'🗂️',name:'Pasta Suspensa 50cx',price:'R$ 89,90',val:89.90,tag:'Escritório',desc:'Kraft resistente, etiquetas impressas, suporte incluso.'},
  {emoji:'🐾',name:'Coleira Anti-pulgas',price:'R$ 79,90',val:79.90,tag:'Pets',desc:'8 meses proteção, repele carrapatos e pulgas, seguro e inodoro.'},
  {emoji:'🦴',name:'Kit Brinquedo Pet',price:'R$ 59,90',val:59.90,tag:'Pets',desc:'6 peças borracha natural, mastigáveis, para raças pequenas e médias.'},
  {emoji:'🐕',name:'Comedouro Elevado',price:'R$ 89,90',val:89.90,tag:'Pets',desc:'Inox duplo, suporte bambu ajustável 3 alturas, antiderrapante.'},
];

let page=0,loading=false;
const BATCH=12;

function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2500);}

/* ═══════════════════════════════════════════════
   ENTRAR NA VITRINE — card já nasce grande,
   sem a animação de "engordando"
═══════════════════════════════════════════════ */
function enterShop(){
  // Aplica shop-mode ANTES do overlay aparecer
  card.classList.add('shop-mode');
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      renderProds(nextBatch());
      panelShop.classList.add('visible');
    });
  });
}

/* ── NAVEGAÇÃO FORM ── */
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
    prodGrid.innerHTML='';
    page=0;filtroAtual='Todos';
    const fl=$('filterLabel');if(fl)fl.textContent='Todos';
    panelReg.style.display='block';panelLogin.style.display='none';
  },400);
}
btnClose.addEventListener('click',closeOverlay);
btnCloseLogin.addEventListener('click',closeOverlay);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeOverlay();});

iCep.addEventListener('input',()=>{let v=iCep.value.replace(/\D/g,'').slice(0,8);if(v.length>5)v=v.slice(0,5)+'-'+v.slice(5);iCep.value=v;});
iTel.addEventListener('input',()=>{let v=iTel.value.replace(/\D/g,'').slice(0,9);if(v.length>5)v=v.slice(0,1)+' '+v.slice(1,5)+'-'+v.slice(5);else if(v.length>1)v=v.slice(0,1)+' '+v.slice(1);iTel.value=v;});

/* ── CADASTRO ── */
btnSub.addEventListener('click',()=>{
  const nome=iNome.value.trim(),cep=iCep.value.trim(),tel=iTel.value.trim(),senha=iSenha.value.trim();
  let ok=true;
  [iNome,iCep,iTel,iSenha].forEach(e=>e.classList.remove('error'));
  if(!nome){shake(iNome);iNome.classList.add('error');ok=false;}
  if(cep.length<9){shake(iCep);iCep.classList.add('error');ok=false;}
  if(tel.length<8){shake(iTel);iTel.classList.add('error');ok=false;}
  if(senha.length<4){shake(iSenha);iSenha.classList.add('error');ok=false;}
  if(!ok)return;
  userDB[nome.toLowerCase()]={nome,cep,tel:'(21) '+tel,senha};
  userData={nome,cep,tel:'(21) '+tel};
  btnSub.classList.add('loading');spawnP(btnSub,30,'click');
  setTimeout(()=>{
    btnSub.classList.remove('loading');
    spawnP(card,55,'success');
    // Esconde overlay, aplica shop-mode, re-exibe — sem transição de tamanho visível
    overlay.classList.remove('visible');
    setTimeout(()=>{
      enterShop();
      overlay.classList.add('visible');
    },360);
  },1800);
});

/* ── LOGIN ── */
btnLogin.addEventListener('click',()=>{
  const nome=lNome.value.trim(),senha=lSenha.value.trim();
  let ok=true;
  [lNome,lSenha].forEach(e=>e.classList.remove('error'));
  if(!nome){shake(lNome);lNome.classList.add('error');ok=false;}
  if(!senha){shake(lSenha);lSenha.classList.add('error');ok=false;}
  if(!ok)return;
  const user=userDB[nome.toLowerCase()];
  if(!user||user.senha!==senha){
    shake(lSenha);lSenha.classList.add('error');
    if(!user){shake(lNome);lNome.classList.add('error');}
    showToast('Usuário ou senha incorretos');
    return;
  }
  userData={...user};
  btnLogin.classList.add('loading');spawnP(btnLogin,30,'click');
  setTimeout(()=>{
    btnLogin.classList.remove('loading');
    spawnP(card,55,'success');
    overlay.classList.remove('visible');
    setTimeout(()=>{
      enterShop();
      overlay.classList.add('visible');
    },360);
  },1400);
});

/* ── LOGOUT ── */
btnLogout.addEventListener('click',()=>{
  profileModal.classList.remove('open');
  cart=[];orders=[];updateBadge();userData={};
  panelShop.classList.remove('visible');
  overlay.classList.remove('visible');
  card.classList.remove('shop-mode');
  prodGrid.innerHTML='';
  page=0;filtroAtual='Todos';
  const fl=$('filterLabel');if(fl)fl.textContent='Todos';
  [lNome,lSenha,iNome,iCep,iTel,iSenha].forEach(e=>{if(e){e.value='';e.classList.remove('error');}});
  panelReg.style.display='block';panelLogin.style.display='none';
  spawnP(scene,35,'click');
  setTimeout(()=>showToast('👋 Até logo, volte sempre!'),400);
});

/* ── PERFIL ── */
const pmNameInput=$('pmNameInput');
const pmCepInput=$('pmCepInput');
const pmTelInput=$('pmTelInput');
const pmSave=$('pmSave');
const pmUploadFoto=$('pmUploadFoto');
const pmProfileImg=$('pmProfileImg');
const pmAvatar=document.querySelector('.pm-avatar');

btnProfile.addEventListener('click',e=>{
  e.stopPropagation();
  if(pmNameInput) pmNameInput.value=userData.nome||localStorage.getItem('user_nome')||'';
  if(pmCepInput)  pmCepInput.value=userData.cep||localStorage.getItem('user_cep')||'';
  if(pmTelInput)  pmTelInput.value=userData.tel||localStorage.getItem('user_tel')||'';
  const foto=localStorage.getItem('user_foto');
  if(foto&&pmProfileImg) pmProfileImg.src=foto;
  profileModal.classList.add('open');
});
pmClose.addEventListener('click',()=>profileModal.classList.remove('open'));
pmBg.addEventListener('click',()=>profileModal.classList.remove('open'));
pmSave.addEventListener('click',()=>{
  userData.nome=pmNameInput.value;
  userData.cep=pmCepInput.value;
  userData.tel=pmTelInput.value;
  localStorage.setItem('user_nome',pmNameInput.value);
  localStorage.setItem('user_cep',pmCepInput.value);
  localStorage.setItem('user_tel',pmTelInput.value);
  showToast('Perfil atualizado com sucesso!');
});
if(pmAvatar) pmAvatar.addEventListener('click',()=>pmUploadFoto&&pmUploadFoto.click());
if(pmUploadFoto){
  pmUploadFoto.addEventListener('change',()=>{
    const file=pmUploadFoto.files[0];
    if(file){
      const reader=new FileReader();
      reader.onload=e=>{
        if(pmProfileImg) pmProfileImg.src=e.target.result;
        localStorage.setItem('user_foto',e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });
}

/* ═══════════════════════════════════════════════
   PRODUTOS — scroll infinito (mobile toque + PC mouse)
═══════════════════════════════════════════════ */
function getFilteredCatalog(){
  if(filtroAtual==='Todos') return catalog;
  return catalog.filter(p=>p.tag===filtroAtual);
}

function nextBatch(){
  const lista=getFilteredCatalog();
  if(!lista.length) return [];
  const start=(page*BATCH)%lista.length;
  const batch=[];
  for(let i=0;i<BATCH;i++){
    batch.push({...lista[(start+i)%lista.length],_uid:Math.random().toString(36).slice(2)});
  }
  page++;
  return batch;
}

function renderProds(items,append=false){
  if(!append) prodGrid.innerHTML='';
  items.forEach((p,i)=>{
    const c=document.createElement('div');
    c.className='prod-card';
    c.style.animationDelay=(append?i*60:i*40)+'ms';
    const palettes=[
      'linear-gradient(160deg,#F5EDE3 0%,#EDE3D6 100%)',
      'linear-gradient(160deg,#F0EAE0 0%,#E8DDD0 100%)',
      'linear-gradient(160deg,#F2EBE2 0%,#EAE0D3 100%)',
      'linear-gradient(160deg,#EDE6DC 0%,#E5DAC8 100%)',
      'linear-gradient(160deg,#F3EDE5 0%,#ECE3D5 100%)',
      'linear-gradient(160deg,#EEE8DE 0%,#E6DBCC 100%)',
    ];
    const bg=palettes[i%palettes.length];
    c.innerHTML=`<div class="prod-thumb" style="background:${bg}" data-tag="${p.tag}">${p.emoji}</div><div class="prod-info"><div class="prod-name">${p.name}</div><div class="prod-price">${p.price}</div></div>`;
    c.addEventListener('click',()=>openProdModal(p,bg));
    prodGrid.appendChild(c);
  });
}

/* Scroll — passive:true para performance, funciona com mouse e touch */
shopScroll.addEventListener('scroll',()=>{
  const{scrollTop,scrollHeight,clientHeight}=shopScroll;
  if(scrollHeight-scrollTop-clientHeight<140&&!loading){
    loading=true;
    loadInd.style.display='flex';
    setTimeout(()=>{
      renderProds(nextBatch(),true);
      loadInd.style.display='none';
      loading=false;
    },650);
  }
},{passive:true});

function openProdModal(p,bg){
  currentProd=p;
  pdmHero.style.background=bg||'#111827';
  const ex=pdmHero.querySelector('.pdm-emoji');if(ex)ex.remove();
  const em=document.createElement('div');em.className='pdm-emoji';em.style.cssText='font-size:76px;position:relative;z-index:2;';em.textContent=p.emoji;
  pdmHero.appendChild(em);
  pdmTag.textContent=p.tag;pdmName.textContent=p.name;pdmPrice.textContent=p.price;pdmDesc.textContent=p.desc;
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

/* ── CARRINHO ── */
function addToCart(p){const ex=cart.find(i=>i.name===p.name);if(ex)ex.qty++;else cart.push({...p,qty:1});updateBadge();}
function updateBadge(){const t=cart.reduce((a,i)=>a+i.qty,0);cartBadge.textContent=t>9?'9+':t;t>0?cartBadge.classList.add('show'):cartBadge.classList.remove('show');}
function openCartModal(){renderCart();cartModal.classList.add('open');}
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
      d.innerHTML=`<div class="ci-thumb" style="background:${bg}">${item.emoji}</div><div class="ci-info"><div class="ci-name">${item.name}</div><div class="ci-price">${item.price}</div></div><div class="ci-qty"><button class="ci-qb" data-idx="${idx}" data-act="dec">−</button><span class="ci-qn">${item.qty}</span><button class="ci-qb" data-idx="${idx}" data-act="inc">+</button></div><button class="ci-rm" data-idx="${idx}">✕</button>`;
      cartList.appendChild(d);
    });
    cTotal.textContent='R$ '+cart.reduce((a,i)=>a+i.val*i.qty,0).toFixed(2).replace('.',',');
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

/* ── PAGAMENTO ── */
checkoutBtn.addEventListener('click',()=>{
  if(!cart.length)return;
  payTotalVal.textContent='R$ '+cart.reduce((a,i)=>a+i.val*i.qty,0).toFixed(2).replace('.',',');
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
function genBoleto(){const c=$('bltBars');c.innerHTML='';const types=['t','m','s'];for(let i=0;i<40;i++){const b=document.createElement('div');b.className='blt-bar '+types[Math.floor(Math.random()*3)];c.appendChild(b);}}
payBtn.addEventListener('click',()=>{
  const rua=$('addrRua').value.trim(),numero=$('addrNumero').value.trim();
  const bairro=$('addrBairro').value.trim(),cidade=$('addrCidade').value.trim(),estado=$('addrEstado').value.trim();
  if(!rua||!numero||!bairro||!cidade||!estado){showToast('Preencha o endereço completo!');return;}
  payBtn.classList.add('loading');spawnP(payBtn,35,'success');
  const ml={Card:'Cartão de crédito',Pix:'Pix',Boleto:'Boleto bancário'};
  setTimeout(()=>{
    payBtn.classList.remove('loading');
    const order={
      id:'#'+(++ordCounter),
      date:new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),
      items:cart.map(i=>({...i})),
      total:cart.reduce((a,i)=>a+i.val*i.qty,0),
      method:ml[payMethod],
      status:payMethod==='Boleto'?'pend':'ok',
      endereco:{rua,numero,bairro,cidade,estado}
    };
    orders.unshift(order);cart=[];updateBadge();
    payNormal.style.display='none';
    payOkSub.textContent=`Pedido ${order.id} registrado 🎉`;
    payOk.style.display='flex';
    setTimeout(()=>payOk.classList.add('show','anim'),30);
    spawnP(payModal.querySelector('.sm-card'),50,'success');
    setTimeout(()=>{payModal.classList.remove('open');payOk.classList.remove('show','anim');},3000);
  },2000);
});

/* ── COMPRAS ── */
btnOrders.addEventListener('click',e=>{e.stopPropagation();renderOrders();ordersModal.classList.add('open');});
omClose.addEventListener('click',()=>ordersModal.classList.remove('open'));
omBg.addEventListener('click',()=>ordersModal.classList.remove('open'));
function renderOrders(){
  ordList.innerHTML='';ordSub.textContent=orders.length+' pedido'+(orders.length===1?'':'s');
  if(!orders.length){ordEmpty.style.display='block';ordList.style.display='none';return;}
  ordEmpty.style.display='none';ordList.style.display='block';
  orders.forEach((o,oi)=>{
    const w=document.createElement('div');w.className='ord-card';w.style.animationDelay=(oi*55)+'ms';
    const rows=o.items.map(i=>`<div class="ord-irow"><div class="oi-em">${i.emoji}</div><div class="oi-nm">${i.name}</div><div class="oi-qt">x${i.qty}</div><div class="oi-pr">${i.price}</div></div>`).join('');
    w.innerHTML=`<div class="ord-chdr" data-oi="${oi}"><div><div class="ord-id">${o.id}</div><div class="ord-date">${o.date}</div></div><div class="ord-right"><div class="ord-total">R$ ${o.total.toFixed(2).replace('.',',')}</div><div class="ord-badge ${o.status}">${o.status==='ok'?'✓ Confirmado':'⏳ Aguardando'}</div></div></div><div class="ord-items" id="oi${oi}">${rows}<div class="ord-method"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>${o.method}</div></div>`;
    ordList.appendChild(w);
  });
}
ordList.addEventListener('click',e=>{const h=e.target.closest('.ord-chdr');if(h){$('oi'+h.dataset.oi).classList.toggle('open');}});

/* ── FILTRO ── */
const btnFiltro=$('btnFiltro');
const dropdown=$('filterDropdown');
const filterLabel=$('filterLabel');
btnFiltro.addEventListener('click',e=>{e.stopPropagation();dropdown.style.display=dropdown.style.display==='block'?'none':'block';});
document.addEventListener('click',()=>{if(dropdown)dropdown.style.display='none';});
document.querySelectorAll('.filter-dropdown div').forEach(item=>{
  item.addEventListener('click',()=>{
    filtroAtual=item.dataset.filtro;
    if(filterLabel) filterLabel.textContent=filtroAtual;
    page=0;prodGrid.innerHTML='';
    renderProds(nextBatch());
    if(dropdown) dropdown.style.display='none';
  });
});

/* ── UTILS ── */
function shake(el){el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:320,easing:'ease'});}
function spawnP(ref,count,type){
  const r=ref.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  const pal={click:['#4a90e2','#7850ff','#60a5fa','#818cf8','#38bdf8'],success:['#34d399','#6ee7b7','#4a90e2','#fbbf24','#a78bfa']};
  for(let i=0;i<count;i++)setTimeout(()=>{
    const p=document.createElement('div');p.className='particle';
    const sz=Math.random()>.55?4+Math.random()*4:2+Math.random()*2,col=pal[type][Math.floor(Math.random()*pal[type].length)];
    p.style.cssText=`width:${sz}px;height:${sz}px;background:${col};border-radius:${Math.random()>.4?'50%':'2px'};box-shadow:0 0 ${sz*2.5}px ${col};left:${cx-sz/2}px;top:${cy-sz/2}px;`;
    document.body.appendChild(p);
    const a=Math.random()*2*Math.PI,sp=type==='success'?90+Math.random()*130:55+Math.random()*85;
    const x=Math.cos(a)*sp,y=Math.sin(a)*sp-(type==='success'?30:0),dur=550+Math.random()*500;
    p.animate([{transform:`translate(0,0) scale(1)`,opacity:1},{transform:`translate(${x}px,${y}px) rotate(${(Math.random()-.5)*720}deg) scale(0)`,opacity:0}],{duration:dur,easing:'cubic-bezier(0.22,0.61,0.36,1)',fill:'forwards'});
    setTimeout(()=>p.remove(),dur+50);
  },i*10);
}