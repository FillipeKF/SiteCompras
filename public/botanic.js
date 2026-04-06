/* ═══════════════════════════════════════════════════════
   LEAL FASHION — Animação Botânica
   • Galhos evitam o centro (logo Leal)
   • PC: mais galhos
   • Tucano voa e pousa após galhos completos
═══════════════════════════════════════════════════════ */
(function(){
  const canvas = document.getElementById('botanicCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Utils ─────────────────────────────────────── */
  const rand  = (a,b)=> a + Math.random()*(b-a);
  const clamp = (v,a,b)=> Math.max(a,Math.min(b,v));
  const lerp  = (a,b,t)=> a+(b-a)*t;

  /* ── Dimensões / zona proibida ──────────────────── */
  let W, H;
  const isPC = ()=> W > 768;

  // Zona central protegida — em torno do texto "Leal"
  function forbidden(){
    const cx = W/2, cy = H * .42;
    const rw  = isPC() ? W*.22 : W*.38;
    const rh  = isPC() ? H*.18 : H*.14;
    return { cx, cy, rw, rh };
  }

  // Verifica se um ponto está dentro da zona proibida
  function inForbidden(x, y){
    const f = forbidden();
    const dx = (x - f.cx)/f.rw;
    const dy = (y - f.cy)/f.rh;
    return dx*dx + dy*dy < 1;
  }

  // Desvia o ponto de controle Bezier para longe do centro
  function deflectFromCenter(px, py, cx0, cy0){
    const f = forbidden();
    const dx = cx0 - f.cx, dy = cy0 - f.cy;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const margin = Math.max(f.rw, f.rh) * 1.35;
    if(dist < margin){
      const ang = Math.atan2(dy, dx);
      return { x: f.cx + Math.cos(ang)*margin*1.1, y: f.cy + Math.sin(ang)*margin*1.1 };
    }
    // Também desviar ponto-final
    if(inForbidden(px, py)){
      const ang2 = Math.atan2(py - f.cy, px - f.cx);
      const push = Math.max(f.rw, f.rh)*1.5;
      return { x: f.cx + Math.cos(ang2)*push, y: f.cy + Math.sin(ang2)*push };
    }
    return { x: cx0, y: cy0 };
  }

  /* ── Paleta ─────────────────────────────────────── */
  const BRANCH_COLORS = [
    'rgba(110,90,62,.32)', 'rgba(90,74,52,.26)',
    'rgba(130,105,72,.24)','rgba(80,66,46,.30)',
  ];

  function pickLeafColor(){
    const h = rand(82,148)|0;
    const s = rand(28,58)|0;
    const l = rand(30,54)|0;
    const a = (rand(32,54)/100).toFixed(2);
    return `hsla(${h},${s}%,${l}%,${a})`;
  }

  /* ── FOLHA ──────────────────────────────────────── */
  class Leaf {
    constructor(x,y,angle,size,color,delay){
      this.x=x; this.y=y; this.baseAngle=angle; this.angle=angle;
      this.size=size; this.color=color; this.delay=delay;
      this.age=0; this.scale=0; this.grown=false;
      this.growRate    = rand(.010,.020);
      this.swayAmp     = rand(.016,.036);
      this.swaySpeed   = rand(.007,.015);
      this.swayOffset  = rand(0,Math.PI*2);
    }
    update(){
      if(this.delay>0){this.delay--;return;}
      this.age++;
      if(!this.grown){ this.scale+=this.growRate; if(this.scale>=1){this.scale=1;this.grown=true;} }
      this.angle = this.baseAngle + Math.sin(this.age*this.swaySpeed+this.swayOffset)*this.swayAmp;
    }
    draw(){
      if(this.scale<=.01) return;
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(this.angle);
      ctx.scale(this.scale,this.scale);
      ctx.globalAlpha = Math.min(1, this.scale*1.1);
      const s=this.size;
      ctx.beginPath();
      ctx.moveTo(0,-s);
      ctx.bezierCurveTo(s*.72,-s*.38, s*.88,s*.28, 0,s*.62);
      ctx.bezierCurveTo(-s*.88,s*.28,-s*.72,-s*.38, 0,-s);
      ctx.fillStyle=this.color; ctx.fill();
      // nervura central
      ctx.beginPath(); ctx.moveTo(0,-s*.88); ctx.quadraticCurveTo(s*.08,0, 0,s*.54);
      ctx.strokeStyle='rgba(40,72,28,.28)'; ctx.lineWidth=Math.max(.5,s*.055); ctx.stroke();
      // nervuras laterais
      for(let i=0;i<3;i++){
        const ty=lerp(-s*.55,s*.25,i/2), vx=s*.38*(1-i*.22), vy=s*.18;
        ctx.globalAlpha*=.6;
        ctx.strokeStyle='rgba(40,72,28,.22)'; ctx.lineWidth=Math.max(.3,s*.030);
        ctx.beginPath(); ctx.moveTo(0,ty); ctx.quadraticCurveTo(vx*.5,ty-vy*.3,vx,ty-vy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,ty); ctx.quadraticCurveTo(-vx*.5,ty-vy*.3,-vx,ty-vy); ctx.stroke();
        ctx.globalAlpha/=.6;
      }
      ctx.restore();
    }
  }

  /* ── GALHO ──────────────────────────────────────── */
  let branches=[], leaves=[], pendingBranches=[], ticker=0, animId;
  const MAX_DEPTH = 4;
  const maxBranches = ()=> isPC() ? 150 : 80;

  class Branch {
    constructor(x,y,angle,length,width,depth,delay,color){
      this.x0=x; this.y0=y; this.angle=angle;
      this.length=length; this.width=width;
      this.depth=depth; this.delay=delay;
      this.color=color||BRANCH_COLORS[Math.floor(Math.random()*BRANCH_COLORS.length)];
      this.t=0; this.done=false;
      this.speed=rand(.005,.013)*(1+depth*.25);
      this.childSprouted=false; this.leafSprouted=false;

      // Ponto de controle Bezier — desvia do centro
      const bend = rand(-35,35)*Math.PI/180;
      const midA = angle+bend, midD=length*rand(.38,.55);
      let cx0 = x+Math.cos(midA)*midD + rand(-18,18);
      let cy0 = y+Math.sin(midA)*midD + rand(-12,12);
      const def = deflectFromCenter(
        x+Math.cos(angle)*length, y+Math.sin(angle)*length,
        cx0, cy0
      );
      this.cx=def.x; this.cy=def.y;

      // Ponta — afasta do centro se necessário
      let ex = x+Math.cos(angle)*length;
      let ey = y+Math.sin(angle)*length;
      if(inForbidden(ex,ey)){
        const ang2 = Math.atan2(ey-H*.42, ex-W/2);
        const f=forbidden(), push=Math.max(f.rw,f.rh)*1.6;
        ex = W/2 + Math.cos(ang2)*push;
        ey = H*.42 + Math.sin(ang2)*push;
      }
      this.x1=ex; this.y1=ey;
    }

    bezier(t){
      const u=1-t;
      return{x:u*u*this.x0+2*u*t*this.cx+t*t*this.x1,
             y:u*u*this.y0+2*u*t*this.cy+t*t*this.y1};
    }

    update(){
      if(this.delay>0){this.delay--;return;}
      if(this.done) return;
      this.t=clamp(this.t+this.speed,0,1);

      // Brota filhos
      if(!this.childSprouted && this.t>rand(.55,.72)){
        this.childSprouted=true;
        if(this.depth<MAX_DEPTH && branches.length+pendingBranches.length<maxBranches()){
          const count = this.depth<2 ? (Math.random()<.5?2:3) : (Math.random()<.6?1:2);
          for(let i=0;i<count;i++){
            const pt=this.bezier(rand(.42,.82));
            const spread=rand(.28,.62)*(Math.PI/2);
            const side=Math.random()>.5?1:-1;
            pendingBranches.push(new Branch(
              pt.x,pt.y,
              this.angle+side*spread+rand(-.12,.12),
              this.length*rand(.42,.68),
              this.width*rand(.40,.62),
              this.depth+1, rand(8,35)|0, this.color));
          }
        }
      }

      // Brota folhas — TODOS os galhos, sem exceção
      if(!this.leafSprouted && this.t>.75){
        this.leafSprouted=true;
        const baseCount = this.depth===0 ? rand(2,4)|0
                        : this.depth===1 ? rand(3,5)|0
                        : this.depth===2 ? rand(4,6)|0
                        : rand(5,8)|0;
        const tMin = this.depth===0?.25 : this.depth===1?.35 : .55;
        const step = (1-tMin)/Math.max(baseCount,1);
        for(let i=0;i<baseCount;i++){
          const tBase=tMin+step*(i+.5);
          const pt=this.bezier(clamp(tBase+rand(-.08,.08),tMin,1));
          // Não coloca folha dentro da zona proibida
          if(inForbidden(pt.x,pt.y)) continue;
          const leafSize = this.depth<=1 ? rand(5,11) : rand(8,16);
          leaves.push(new Leaf(
            pt.x+rand(-8,8), pt.y+rand(-8,8),
            rand(-Math.PI,Math.PI), leafSize,
            pickLeafColor(), rand(0,60)|0));
        }
      }

      if(this.t>=1) this.done=true;
    }

    draw(){
      if(this.delay>0||this.t<=0) return;
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
      const steps=Math.max(4,(this.length*this.t*.45)|0);
      ctx.beginPath();
      const p0=this.bezier(0); ctx.moveTo(p0.x,p0.y);
      for(let i=1;i<=steps;i++){
        const p=this.bezier((i/steps)*this.t); ctx.lineTo(p.x,p.y);
      }
      ctx.strokeStyle=this.color;
      ctx.lineWidth=this.width*clamp(1-this.depth*.17,.15,1);
      ctx.stroke(); ctx.restore();
    }
  }

  /* ── RAÍZES ─────────────────────────────────────── */
  function buildRoots(){
    const pc = isPC();
    // Configs base — sempre presentes (mobile + PC)
    const base = [
      // inf-esquerdo
      {x:rand(-8,20),  y:H+8, angle:rand(-Math.PI*.76,-Math.PI*.54), len:rand(H*.38,H*.54), w:rand(3.5,5.2)},
      // inf-direito
      {x:W+8,          y:H+8, angle:rand(-Math.PI*.46,-Math.PI*.24), len:rand(H*.38,H*.54), w:rand(3.5,5.2)},
      // sup-esquerdo
      {x:rand(-8,18),  y:rand(-8,18), angle:rand(Math.PI*.04,Math.PI*.32), len:rand(H*.30,H*.46), w:rand(2.8,4.4)},
      // sup-direito
      {x:W+8,          y:rand(-8,18), angle:rand(Math.PI*.68,Math.PI*.96), len:rand(H*.30,H*.46), w:rand(2.8,4.4)},
      // lat-esquerda
      {x:-8,           y:rand(H*.25,H*.65), angle:rand(-.42,.42), len:rand(H*.24,H*.40), w:rand(2.4,3.8)},
      // lat-direita
      {x:W+8,          y:rand(H*.25,H*.65), angle:rand(Math.PI-.42,Math.PI+.42), len:rand(H*.24,H*.40), w:rand(2.4,3.8)},
      // inf-centro
      {x:rand(W*.35,W*.65), y:H+8, angle:rand(-Math.PI*.88,-Math.PI*.52), len:rand(H*.40,H*.58), w:rand(3.0,4.6)},
    ];

    // Extras apenas no PC
    const extra = pc ? [
      {x:rand(-8,20),  y:rand(H*.4,H*.75), angle:rand(-.25,.55), len:rand(H*.28,H*.42), w:rand(2.2,3.5)},
      {x:W+8,          y:rand(H*.4,H*.75), angle:rand(Math.PI-.55,Math.PI+.25), len:rand(H*.28,H*.42), w:rand(2.2,3.5)},
      {x:rand(W*.1,W*.3), y:H+8, angle:rand(-Math.PI*.82,-Math.PI*.58), len:rand(H*.32,H*.48), w:rand(2.6,4.0)},
      {x:rand(W*.7,W*.9), y:H+8, angle:rand(-Math.PI*.42,-Math.PI*.18), len:rand(H*.32,H*.48), w:rand(2.6,4.0)},
      {x:rand(-8,18),  y:rand(H*.5,H*.85), angle:rand(.05,.55), len:rand(H*.22,H*.36), w:rand(2.0,3.2)},
      {x:W+8,          y:rand(H*.5,H*.85), angle:rand(Math.PI-.55,Math.PI-.05), len:rand(H*.22,H*.36), w:rand(2.0,3.2)},
    ] : [];

    [...base, ...extra].forEach((c,i)=>{
      branches.push(new Branch(c.x,c.y,c.angle,c.len,c.w,0,i*(rand(18,45)|0)));
    });
  }

  /* ═══════════════════════════════════════════════════
     TUCANO — fiel à foto: preto, peito branco+amarelo,
     bico laranja/amarelo enorme, olho azul esverdeado
  ═══════════════════════════════════════════════════ */
  const toucan = {
    active:false, phase:'idle', x:0, y:0,
    targetX:0, targetY:0, startX:0, startY:0,
    flightT:0, flightDur:150, wingT:0, flipX:false,
    arcCX:0, arcCY:0, launched:false,
  };

  function launchToucan(){
    if(toucan.launched) return;
    toucan.launched=true; toucan.active=true;
    toucan.phase='flying'; toucan.flightT=0;

    const fromLeft = Math.random()>.5;
    toucan.startX = fromLeft ? -100 : W+100;
    toucan.startY = rand(H*.06, H*.22);
    toucan.flipX  = !fromLeft;  // vira o tucano p/ encarar o destino

    // Pousa no topo da letra "L" — borda esquerda do texto "Leal"
    // O texto "Leal" está centrado em W/2, H*~0.42
    // A letra L está a ~rw*0.85 à esquerda do centro
    const f = forbidden();
    const letterLx = f.cx - f.rw * 0.82;   // borda esquerda do "L"
    const letterLy = f.cy - f.rh * 1.05;   // acima da linha de topo
    toucan.targetX = letterLx;
    toucan.targetY = letterLy;

    toucan.arcCX = (toucan.startX+toucan.targetX)*.5 + rand(-40,40);
    toucan.arcCY = Math.min(toucan.startY, toucan.targetY) - rand(H*.1, H*.2);
    toucan.x=toucan.startX; toucan.y=toucan.startY;
  }

  function drawToucan(x, y, sc, flip, wingT, alpha){
    ctx.save();
    ctx.globalAlpha = clamp(alpha,0,1);
    ctx.translate(x, y);
    // flip: quando voa da direita p/ esquerda, espelha
    ctx.scale(flip ? -sc : sc, sc);

    const perched = toucan.phase==='perched';
    const landing = toucan.phase==='landing';

    // ── batida de asa ──────────────────────────────
    const beat = perched ? 0 : Math.sin(wingT * .22) * .5;

    // ══ PATAS (atrás do corpo) ════════════════════
    if(perched || landing){
      ctx.save();
      ctx.strokeStyle='#4a3a22'; ctx.lineWidth=2.2; ctx.lineCap='round';
      // Pata traseira
      ctx.beginPath(); ctx.moveTo(-2,14); ctx.lineTo(-4,26);
      ctx.lineTo(-10,28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4,26); ctx.lineTo(0,30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4,26); ctx.lineTo(-8,31); ctx.stroke();
      // Pata dianteira
      ctx.beginPath(); ctx.moveTo(6,14); ctx.lineTo(4,26);
      ctx.lineTo(10,28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4,26); ctx.lineTo(8,30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4,26); ctx.lineTo(0,31); ctx.stroke();
      ctx.restore();
    }

    // ══ ASA (atrás do corpo) ══════════════════════
    ctx.save();
    ctx.translate(0, 2);
    ctx.rotate(beat);
    ctx.beginPath();
    ctx.moveTo(2,0);
    ctx.bezierCurveTo(-10,-16, -28,-22, -30,-10);
    ctx.bezierCurveTo(-26, 4,  -8, 10,   2,  8);
    ctx.closePath();
    ctx.fillStyle='#161412';
    ctx.fill();
    // detalhe de pena na asa
    ctx.beginPath();
    ctx.moveTo(-8,-8); ctx.bezierCurveTo(-18,-14,-26,-12,-28,-8);
    ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();

    // ══ CORPO PRINCIPAL ═══════════════════════════
    // Corpo preto-azulado
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 15, -.12, 0, Math.PI*2);
    ctx.fillStyle='#111010';
    ctx.fill();

    // ══ PEITO BRANCO ══════════════════════════════
    // Grande área branca do pescoço/peito (característica marcante)
    ctx.beginPath();
    ctx.moveTo(8,-12);
    ctx.bezierCurveTo(20,-8, 22, 4, 14, 12);
    ctx.bezierCurveTo( 6,16,  -4,12, -2,  4);
    ctx.bezierCurveTo(-4,-2,  2,-14,  8,-12);
    ctx.fillStyle='#F0EDE4';
    ctx.fill();

    // ══ FAIXA AMARELA sob o peito ═════════════════
    ctx.beginPath();
    ctx.moveTo(12, 10);
    ctx.bezierCurveTo(14,14,  8,18,  2,16);
    ctx.bezierCurveTo(-4,14, -6,10, -2, 8);
    ctx.bezierCurveTo( 4, 6, 10, 7, 12,10);
    ctx.fillStyle='#F5C200';
    ctx.fill();

    // Linha vermelha fina separando amarelo do preto (embaixo)
    ctx.beginPath();
    ctx.moveTo(-4,14); ctx.bezierCurveTo(2,18, 10,16, 14,12);
    ctx.strokeStyle='#CC2200'; ctx.lineWidth=2; ctx.stroke();

    // ══ CABEÇA ════════════════════════════════════
    ctx.beginPath();
    ctx.ellipse(14, -14, 13, 12, .1, 0, Math.PI*2);
    ctx.fillStyle='#0e0d0c';
    ctx.fill();

    // Topo da cabeça com reflexo sutil
    ctx.beginPath();
    ctx.ellipse(12,-17,7,4,.2,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.04)';
    ctx.fill();

    // ══ ANEL ORBITAL AZUL-ESVERDEADO (ao redor do olho) ══
    ctx.beginPath();
    ctx.arc(20,-14, 5.5, 0, Math.PI*2);
    ctx.fillStyle='#3A8A6A';
    ctx.fill();
    // anel amarelo interno
    ctx.beginPath();
    ctx.arc(20,-14, 4.2, 0, Math.PI*2);
    ctx.fillStyle='#D4A800';
    ctx.fill();

    // ══ OLHO ══════════════════════════════════════
    ctx.beginPath();
    ctx.arc(20,-14, 3, 0, Math.PI*2);
    ctx.fillStyle='#050505';
    ctx.fill();
    // reflexo
    ctx.beginPath();
    ctx.arc(21,-15, 1, 0, Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.85)';
    ctx.fill();

    // ══ BICO — enorme, laranja/amarelo, curvo ═════
    ctx.save();
    ctx.translate(26,-16);

    // Maxilar superior (maior parte) — laranja→amarelo
    const bilGrad = ctx.createLinearGradient(0,0,42,0);
    bilGrad.addColorStop(0,  '#F07800');   // laranja na base
    bilGrad.addColorStop(.5, '#F8B800');   // amarelo dourado
    bilGrad.addColorStop(.85,'#F9D040');   // amarelo claro na ponta
    bilGrad.addColorStop(1,  '#E06000');   // volta laranja na ponta

    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.bezierCurveTo(10,-7,  26,-8, 42,-4);   // borda superior curva p/ baixo
    ctx.bezierCurveTo(44,-3,  44, 0, 42, 0);   // ponta arredondada
    ctx.bezierCurveTo(26, 2,  10,-1,  0,  4);  // borda inferior
    ctx.closePath();
    ctx.fillStyle = bilGrad;
    ctx.fill();

    // Sulco central no bico
    ctx.beginPath();
    ctx.moveTo(2,1); ctx.bezierCurveTo(14,-2, 28,-2, 42,-2);
    ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=1.2; ctx.stroke();

    // Mandíbula inferior — mais fina, mais escura
    ctx.beginPath();
    ctx.moveTo(0,4);
    ctx.bezierCurveTo(10, 7,  26, 6, 42, 2);
    ctx.bezierCurveTo(42, 4,  26, 9, 10, 8);
    ctx.bezierCurveTo( 4, 7,   0, 6,  0, 4);
    ctx.fillStyle='#C05800';
    ctx.fill();

    // Linha de separação das mandíbulas
    ctx.beginPath();
    ctx.moveTo(0,4); ctx.bezierCurveTo(14,5, 28,4, 42,2);
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=.9; ctx.stroke();

    ctx.restore();

    // ══ CAUDA ═════════════════════════════════════
    ctx.beginPath();
    ctx.moveTo(-18, 6);
    ctx.bezierCurveTo(-26, 8, -34,14, -32,22);
    ctx.bezierCurveTo(-26,16, -18,12, -16,10);
    ctx.fillStyle='#0e0d0c';
    ctx.fill();
    // reflexo azulado na cauda
    ctx.beginPath();
    ctx.moveTo(-20,8); ctx.bezierCurveTo(-28,10,-32,16,-30,20);
    ctx.strokeStyle='rgba(80,120,200,.08)'; ctx.lineWidth=2; ctx.stroke();

    ctx.restore();
  }

  function updateToucan(){
    if(!toucan.active) return;
    toucan.wingT++;

    if(toucan.phase === 'flying'){
      toucan.flightT++;
      const t = clamp(toucan.flightT/toucan.flightDur, 0, 1);
      // Ease in-out
      const et = t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)*.5;
      // Arco quadrático
      const u=1-et;
      toucan.x = u*u*toucan.startX + 2*u*et*toucan.arcCX + et*et*toucan.targetX;
      toucan.y = u*u*toucan.startY + 2*u*et*toucan.arcCY + et*et*toucan.targetY;
      toucan.flipX = (toucan.targetX < toucan.startX);

      if(t >= 1){
        toucan.phase  = 'landing';
        toucan.wingT  = 0;
        toucan.x      = toucan.targetX;
        toucan.y      = toucan.targetY;
      }
    }

    if(toucan.phase === 'landing'){
      // Bate asas rápido ao pousar, depois para
      if(toucan.wingT > 40){ toucan.phase = 'perched'; }
    }
  }

  function drawToucanFrame(){
    if(!toucan.active) return;
    const alpha = toucan.phase==='flying' ? clamp(toucan.flightT/20,0,1) : 1;
    const sc = isPC() ? 1.6 : 1.1;
    drawToucan(toucan.x, toucan.y, sc, toucan.flipX, toucan.wingT, alpha);
  }

  /* ── Verifica se todos os galhos terminaram ──── */
  let allDoneChecked = false;
  function checkAllDone(){
    if(allDoneChecked) return;
    if(branches.length < 3) return;
    const done = branches.every(b => b.done || b.delay > 0);
    const leavesGrown = leaves.filter(l=>l.grown).length;
    if(done && leavesGrown > leaves.length*.7){
      allDoneChecked = true;
      setTimeout(()=> launchToucan(), 800);
    }
  }

  /* ── Init / resize ──────────────────────────── */
  function resize(){
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function init(){
    branches=[]; leaves=[]; pendingBranches=[];
    ticker=0; allDoneChecked=false;
    toucan.active=false; toucan.launched=false; toucan.phase='idle';
    buildRoots();
  }

  /* ── Loop principal ─────────────────────────── */
  function loop(){
    animId = requestAnimationFrame(loop);
    ticker++;

    if(pendingBranches.length){ branches.push(...pendingBranches); pendingBranches=[]; }

    ctx.clearRect(0,0,W,H);

    for(let i=0;i<branches.length;i++){ branches[i].update(); branches[i].draw(); }
    for(let i=0;i<leaves.length;i++){   leaves[i].update();   leaves[i].draw();   }

    updateToucan();
    drawToucanFrame();

    if(ticker % 30 === 0) checkAllDone();
  }

  resize();
  window.addEventListener('resize',()=>{ resize(); init(); });
  init();
  loop();

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) cancelAnimationFrame(animId); else loop();
  });

})();