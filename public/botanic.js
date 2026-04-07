(function(){
const canvas=document.getElementById('botanicCanvas');
if(!canvas)return;
const ctx=canvas.getContext('2d');

const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

let W,H;
const isPC=()=>W>500;

function resize(){
  W=canvas.width=canvas.offsetWidth;
  H=canvas.height=canvas.offsetHeight;
}

function forbidden(){
  const cx=W/2,cy=H*.42;
  const rw=isPC()?W*.22:W*.38;
  const rh=isPC()?H*.18:H*.14;
  return{cx,cy,rw,rh};
}
function inForbidden(x,y){
  const f=forbidden();
  const dx=(x-f.cx)/f.rw,dy=(y-f.cy)/f.rh;
  return dx*dx+dy*dy<1;
}
function deflectFromCenter(px,py,cx0,cy0){
  const f=forbidden();
  const dx=cx0-f.cx,dy=cy0-f.cy;
  const dist=Math.sqrt(dx*dx+dy*dy);
  const margin=Math.max(f.rw,f.rh)*1.35;
  if(dist<margin){const ang=Math.atan2(dy,dx);return{x:f.cx+Math.cos(ang)*margin*1.1,y:f.cy+Math.sin(ang)*margin*1.1};}
  if(inForbidden(px,py)){const ang2=Math.atan2(py-f.cy,px-f.cx);const push=Math.max(f.rw,f.rh)*1.5;return{x:f.cx+Math.cos(ang2)*push,y:f.cy+Math.sin(ang2)*push};}
  return{x:cx0,y:cy0};
}

const BRANCH_COLORS=['rgba(110,90,62,.32)','rgba(90,74,52,.26)','rgba(130,105,72,.24)','rgba(80,66,46,.30)'];
function pickLeafColor(){const h=rand(82,148)|0,s=rand(28,58)|0,l=rand(30,54)|0;return `hsla(${h},${s}%,${l}%,${(rand(32,54)/100).toFixed(2)})`;}

class Leaf{
  constructor(x,y,angle,size,color,delay){
    this.x=x;this.y=y;this.baseAngle=angle;this.angle=angle;
    this.size=size;this.color=color;this.delay=delay;
    this.age=0;this.scale=0;this.grown=false;
    this.growRate=rand(.010,.020);
    this.swayAmp=rand(.016,.036);this.swaySpeed=rand(.007,.015);
    this.swayOffset=rand(0,Math.PI*2);
  }
  update(){
    if(this.delay>0){this.delay--;return;}
    this.age++;
    if(!this.grown){this.scale+=this.growRate;if(this.scale>=1){this.scale=1;this.grown=true;}}
    this.angle=this.baseAngle+Math.sin(this.age*this.swaySpeed+this.swayOffset)*this.swayAmp;
  }
  draw(){
    if(this.scale<=.01)return;
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.scale(this.scale,this.scale);
    ctx.globalAlpha=Math.min(1,this.scale*1.1);
    const s=this.size;
    ctx.beginPath();ctx.moveTo(0,-s);
    ctx.bezierCurveTo(s*.72,-s*.38,s*.88,s*.28,0,s*.62);
    ctx.bezierCurveTo(-s*.88,s*.28,-s*.72,-s*.38,0,-s);
    ctx.fillStyle=this.color;ctx.fill();
    ctx.beginPath();ctx.moveTo(0,-s*.88);ctx.quadraticCurveTo(s*.08,0,0,s*.54);
    ctx.strokeStyle='rgba(40,72,28,.28)';ctx.lineWidth=Math.max(.5,s*.055);ctx.stroke();
    ctx.restore();
  }
}

let branches=[],leaves=[],pendingBranches=[],ticker=0,animId;
const MAX_DEPTH=4;
const maxBranches=()=>isPC()?150:80;

class Branch{
  constructor(x,y,angle,length,width,depth,delay,color){
    this.x0=x;this.y0=y;this.angle=angle;
    this.length=length;this.width=width;
    this.depth=depth;this.delay=delay;
    this.color=color||BRANCH_COLORS[Math.floor(Math.random()*BRANCH_COLORS.length)];
    this.t=0;this.done=false;
    this.speed=rand(.005,.013)*(1+depth*.25);
    this.childSprouted=false;this.leafSprouted=false;
    const bend=rand(-35,35)*Math.PI/180;
    const midA=angle+bend,midD=length*rand(.38,.55);
    let cx0=x+Math.cos(midA)*midD+rand(-18,18);
    let cy0=y+Math.sin(midA)*midD+rand(-12,12);
    const def=deflectFromCenter(x+Math.cos(angle)*length,y+Math.sin(angle)*length,cx0,cy0);
    this.cx=def.x;this.cy=def.y;
    let ex=x+Math.cos(angle)*length,ey=y+Math.sin(angle)*length;
    if(inForbidden(ex,ey)){
      const ang2=Math.atan2(ey-H*.42,ex-W/2);
      const f=forbidden(),push=Math.max(f.rw,f.rh)*1.6;
      ex=W/2+Math.cos(ang2)*push;ey=H*.42+Math.sin(ang2)*push;
    }
    this.x1=ex;this.y1=ey;
  }
  bezier(t){
    const u=1-t;
    return{x:u*u*this.x0+2*u*t*this.cx+t*t*this.x1,y:u*u*this.y0+2*u*t*this.cy+t*t*this.y1};
  }
  update(){
    if(this.delay>0){this.delay--;return;}
    if(this.done)return;
    this.t=clamp(this.t+this.speed,0,1);
    if(!this.childSprouted&&this.t>rand(.55,.72)){
      this.childSprouted=true;
      if(this.depth<MAX_DEPTH&&branches.length+pendingBranches.length<maxBranches()){
        const count=this.depth<2?(Math.random()<.5?2:3):(Math.random()<.6?1:2);
        for(let i=0;i<count;i++){
          const pt=this.bezier(rand(.42,.82));
          const spread=rand(.28,.62)*(Math.PI/2);
          const side=Math.random()>.5?1:-1;
          pendingBranches.push(new Branch(pt.x,pt.y,this.angle+side*spread+rand(-.12,.12),
            this.length*rand(.42,.68),this.width*rand(.40,.62),
            this.depth+1,rand(8,35)|0,this.color));
        }
      }
    }
    if(!this.leafSprouted&&this.t>.75){
      this.leafSprouted=true;
      const baseCount=this.depth===0?rand(2,4)|0:this.depth===1?rand(3,5)|0:this.depth===2?rand(4,6)|0:rand(5,8)|0;
      const tMin=this.depth===0?.25:this.depth===1?.35:.55;
      const step=(1-tMin)/Math.max(baseCount,1);
      for(let i=0;i<baseCount;i++){
        const tBase=tMin+step*(i+.5);
        const pt=this.bezier(clamp(tBase+rand(-.08,.08),tMin,1));
        if(inForbidden(pt.x,pt.y))continue;
        const leafSize=this.depth<=1?rand(5,11):rand(8,16);
        leaves.push(new Leaf(pt.x+rand(-8,8),pt.y+rand(-8,8),rand(-Math.PI,Math.PI),leafSize,pickLeafColor(),rand(0,60)|0));
      }
    }
    if(this.t>=1)this.done=true;
  }
  draw(){
    if(this.delay>0||this.t<=0)return;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const steps=Math.max(4,(this.length*this.t*.45)|0);
    ctx.beginPath();
    const p0=this.bezier(0);ctx.moveTo(p0.x,p0.y);
    for(let i=1;i<=steps;i++){const p=this.bezier((i/steps)*this.t);ctx.lineTo(p.x,p.y);}
    ctx.strokeStyle=this.color;
    ctx.lineWidth=this.width*clamp(1-this.depth*.17,.15,1);
    ctx.stroke();ctx.restore();
  }
}

function buildRoots(){
  const pc=isPC();
  const base=[
    {x:rand(-8,20),y:H+8,angle:rand(-Math.PI*.76,-Math.PI*.54),len:rand(H*.38,H*.54),w:rand(3.5,5.2)},
    {x:W+8,y:H+8,angle:rand(-Math.PI*.46,-Math.PI*.24),len:rand(H*.38,H*.54),w:rand(3.5,5.2)},
    {x:rand(-8,18),y:rand(-8,18),angle:rand(Math.PI*.04,Math.PI*.32),len:rand(H*.30,H*.46),w:rand(2.8,4.4)},
    {x:W+8,y:rand(-8,18),angle:rand(Math.PI*.68,Math.PI*.96),len:rand(H*.30,H*.46),w:rand(2.8,4.4)},
    {x:-8,y:rand(H*.25,H*.65),angle:rand(-.42,.42),len:rand(H*.24,H*.40),w:rand(2.4,3.8)},
    {x:W+8,y:rand(H*.25,H*.65),angle:rand(Math.PI-.42,Math.PI+.42),len:rand(H*.24,H*.40),w:rand(2.4,3.8)},
    {x:rand(W*.35,W*.65),y:H+8,angle:rand(-Math.PI*.88,-Math.PI*.52),len:rand(H*.40,H*.58),w:rand(3.0,4.6)},
  ];
  const extra=pc?[
    {x:rand(-8,20),y:rand(H*.4,H*.75),angle:rand(-.25,.55),len:rand(H*.28,H*.42),w:rand(2.2,3.5)},
    {x:W+8,y:rand(H*.4,H*.75),angle:rand(Math.PI-.55,Math.PI+.25),len:rand(H*.28,H*.42),w:rand(2.2,3.5)},
    {x:rand(W*.1,W*.3),y:H+8,angle:rand(-Math.PI*.82,-Math.PI*.58),len:rand(H*.32,H*.48),w:rand(2.6,4.0)},
    {x:rand(W*.7,W*.9),y:H+8,angle:rand(-Math.PI*.42,-Math.PI*.18),len:rand(H*.32,H*.48),w:rand(2.6,4.0)},
  ]:[];
  [...base,...extra].forEach((c,i)=>{
    branches.push(new Branch(c.x,c.y,c.angle,c.len,c.w,0,i*(rand(18,45)|0)));
  });
}

function findPerchBranch(exclude){
  const margin=60;
  const candidates=branches.filter(b=>{
    if(!b.done)return false;
    if(b.depth<2)return false;
    if(b===exclude)return false;
    const tip=b.bezier(1);
    if(tip.x<margin||tip.x>W-margin)return false;
    if(tip.y<margin||tip.y>H-margin)return false;
    if(inForbidden(tip.x,tip.y))return false;
    return true;
  });
  if(candidates.length===0)return null;
  candidates.sort((a,b2)=>{
    const ta=a.bezier(1),tb=b2.bezier(1);
    const scoreA=(1-Math.abs(Math.sin(a.angle)))*2+(ta.y<H*.55?1:0);
    const scoreB=(1-Math.abs(Math.sin(b2.angle)))*2+(tb.y<H*.55?1:0);
    return scoreB-scoreA;
  });
  const pool=candidates.slice(0,Math.min(5,candidates.length));
  return pool[Math.floor(Math.random()*pool.length)];
}

/* ══ TUCANO ══════════════════════════════════════════ */
const SC=()=>isPC()?1.6:1.1;
const HITBOX_R=()=>isPC()?55:42;

const toucan={
  active:false,phase:'idle',
  x:0,y:0,
  targetX:0,targetY:0,
  startX:0,startY:0,
  flightT:0,flightDur:150,
  wingT:0,flipX:false,
  arcCX:0,arcCY:0,
  launched:false,
  perchBranch:null,
  blinking:false,blinkT:0,eyeOpen:1,
  hovered:false,
};

function flyTo(targetBranch,startX,startY){
  const tip=targetBranch.bezier(1);
  toucan.perchBranch=targetBranch;
  toucan.phase='flying';
  toucan.flightT=0;
  toucan.flightDur=rand(110,170)|0;
  toucan.startX=startX!==undefined?startX:toucan.x;
  toucan.startY=startY!==undefined?startY:toucan.y;
  toucan.targetX=tip.x;
  toucan.targetY=tip.y-(isPC()?28:20);
  toucan.arcCX=(toucan.startX+toucan.targetX)*.5+rand(-60,60);
  toucan.arcCY=Math.min(toucan.startY,toucan.targetY)-rand(H*.08,H*.22);
  toucan.flipX=(toucan.targetX<toucan.startX);
  toucan.active=true;
}

function launchToucan(){
  if(toucan.launched)return;
  const perch=findPerchBranch(null);
  if(!perch){setTimeout(()=>launchToucan(),1000);return;}
  toucan.launched=true;
  const fromLeft=Math.random()>.5;
  flyTo(perch,fromLeft?-100:W+100,rand(H*.06,H*.22));
}

function startBlink(){toucan.blinking=true;toucan.blinkT=0;}

function onToucanClick(){
  if(toucan.phase==='flying'||toucan.phase==='fleeing')return;
  const reaction=Math.random();
  if(reaction<0.35){
    startBlink();
  } else if(reaction<0.65){
    const same=toucan.perchBranch;
    toucan.phase='fleeing';
    toucan.flightT=0;
    toucan.flightDur=rand(80,120)|0;
    toucan.startX=toucan.x;toucan.startY=toucan.y;
    const exitX=toucan.flipX?-120:W+120;
    const exitY=rand(H*.05,H*.25);
    toucan.targetX=exitX;toucan.targetY=exitY;
    toucan.arcCX=(toucan.x+exitX)*.5+rand(-40,40);
    toucan.arcCY=Math.min(toucan.y,exitY)-rand(H*.05,H*.15);
    toucan.flipX=(exitX<toucan.x);
    setTimeout(()=>{
      if(same)flyTo(same);else{const nb=findPerchBranch(null);if(nb)flyTo(nb);}
    },rand(900,1800)|0);
  } else {
    const nb=findPerchBranch(toucan.perchBranch);
    if(!nb){startBlink();return;}
    toucan.phase='flying';
    toucan.flightT=0;
    toucan.flightDur=rand(130,180)|0;
    const tip=nb.bezier(1);
    toucan.startX=toucan.x;toucan.startY=toucan.y;
    toucan.perchBranch=nb;
    toucan.targetX=tip.x;
    toucan.targetY=tip.y-(isPC()?28:20);
    toucan.arcCX=(toucan.x+tip.x)*.5+rand(-50,50);
    toucan.arcCY=Math.min(toucan.y,toucan.targetY)-rand(H*.08,H*.2);
    toucan.flipX=(toucan.targetX<toucan.x);
  }
}

/* ── coordenadas canônicas (CORREÇÃO PRINCIPAL) ─── */
function canvasCoords(clientX,clientY){
  const r=canvas.getBoundingClientRect();
  return{
    x:(clientX-r.left)*(W/r.width),
    y:(clientY-r.top)*(H/r.height)
  };
}

function toucanHit(cx,cy){
  if(!toucan.active)return false;
  if(toucan.phase==='fleeing')return false;
  const dx=cx-toucan.x,dy=cy-toucan.y;
  return Math.sqrt(dx*dx+dy*dy)<HITBOX_R();
}

canvas.addEventListener('mousemove',e=>{
  const{x,y}=canvasCoords(e.clientX,e.clientY);
  const hit=toucanHit(x,y);
  toucan.hovered=hit;
  canvas.style.cursor=hit?'pointer':'default';
});

canvas.addEventListener('click',e=>{
  const{x,y}=canvasCoords(e.clientX,e.clientY);
  if(toucanHit(x,y))onToucanClick();
});

canvas.addEventListener('touchstart',e=>{
  const t=e.touches[0];
  const{x,y}=canvasCoords(t.clientX,t.clientY);
  if(toucanHit(x,y)){e.preventDefault();onToucanClick();}
},{passive:false});

/* ── update tucano ─────────────────────────────── */
function updateToucan(){
  if(!toucan.active)return;
  toucan.wingT++;
  if(toucan.blinking){
    toucan.blinkT++;
    const cycle=toucan.blinkT%18;
    toucan.eyeOpen=cycle<9?1-(cycle/9):(cycle-9)/9;
    if(toucan.blinkT>=54){toucan.blinking=false;toucan.eyeOpen=1;toucan.blinkT=0;}
  }
  if(toucan.phase==='flying'||toucan.phase==='fleeing'){
    toucan.flightT++;
    const t=clamp(toucan.flightT/toucan.flightDur,0,1);
    const et=t<.5?2*t*t:1-Math.pow(-2*t+2,2)*.5;
    const u=1-et;
    toucan.x=u*u*toucan.startX+2*u*et*toucan.arcCX+et*et*toucan.targetX;
    toucan.y=u*u*toucan.startY+2*u*et*toucan.arcCY+et*et*toucan.targetY;
    if(t>=1){
      if(toucan.phase==='flying'){toucan.phase='landing';toucan.wingT=0;}
      else{toucan.active=false;}
      toucan.x=toucan.targetX;toucan.y=toucan.targetY;
    }
  }
  if(toucan.phase==='landing'){if(toucan.wingT>40)toucan.phase='perched';}
}

/* ── desenho do tucano ─────────────────────────── */
function drawToucan(x,y,sc,flip,wingT,alpha){
  ctx.save();
  ctx.globalAlpha=clamp(alpha,0,1);
  ctx.translate(x,y);
  ctx.scale(flip?-sc:sc,sc);
  const perched=toucan.phase==='perched';
  const landing=toucan.phase==='landing';
  const beat=perched?0:Math.sin(wingT*.22)*.5;
  const eyeH=toucan.eyeOpen;

  if(toucan.hovered&&perched){
    ctx.save();
    ctx.beginPath();ctx.arc(10,-8,42,0,Math.PI*2);
    ctx.fillStyle='rgba(255,220,80,.09)';ctx.fill();
    ctx.restore();
  }

  if(perched||landing){
    ctx.save();
    ctx.strokeStyle='#4a3a22';ctx.lineWidth=2.2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-2,14);ctx.lineTo(-4,26);ctx.lineTo(-10,28);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-4,26);ctx.lineTo(0,30);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-4,26);ctx.lineTo(-8,31);ctx.stroke();
    ctx.beginPath();ctx.moveTo(6,14);ctx.lineTo(4,26);ctx.lineTo(10,28);ctx.stroke();
    ctx.beginPath();ctx.moveTo(4,26);ctx.lineTo(8,30);ctx.stroke();
    ctx.beginPath();ctx.moveTo(4,26);ctx.lineTo(0,31);ctx.stroke();
    ctx.restore();
  }

  ctx.save();ctx.translate(0,2);ctx.rotate(beat);
  ctx.beginPath();ctx.moveTo(2,0);
  ctx.bezierCurveTo(-10,-16,-28,-22,-30,-10);
  ctx.bezierCurveTo(-26,4,-8,10,2,8);
  ctx.closePath();ctx.fillStyle='#161412';ctx.fill();
  ctx.restore();

  ctx.beginPath();ctx.ellipse(0,2,20,15,-.12,0,Math.PI*2);
  ctx.fillStyle='#111010';ctx.fill();

  ctx.beginPath();ctx.moveTo(8,-12);
  ctx.bezierCurveTo(20,-8,22,4,14,12);
  ctx.bezierCurveTo(6,16,-4,12,-2,4);
  ctx.bezierCurveTo(-4,-2,2,-14,8,-12);
  ctx.fillStyle='#F0EDE4';ctx.fill();

  ctx.beginPath();ctx.moveTo(12,10);
  ctx.bezierCurveTo(14,14,8,18,2,16);
  ctx.bezierCurveTo(-4,14,-6,10,-2,8);
  ctx.bezierCurveTo(4,6,10,7,12,10);
  ctx.fillStyle='#F5C200';ctx.fill();

  ctx.beginPath();ctx.moveTo(-4,14);ctx.bezierCurveTo(2,18,10,16,14,12);
  ctx.strokeStyle='#CC2200';ctx.lineWidth=2;ctx.stroke();

  ctx.beginPath();ctx.ellipse(14,-14,13,12,.1,0,Math.PI*2);
  ctx.fillStyle='#0e0d0c';ctx.fill();

  ctx.beginPath();ctx.arc(20,-14,5.5,0,Math.PI*2);
  ctx.fillStyle='#3A8A6A';ctx.fill();
  ctx.beginPath();ctx.arc(20,-14,4.2,0,Math.PI*2);
  ctx.fillStyle='#D4A800';ctx.fill();

  ctx.save();
  ctx.beginPath();ctx.arc(20,-14,3,0,Math.PI*2);ctx.fillStyle='#050505';ctx.fill();
  if(eyeH>0.05){
    const ey2=-14,er=3;
    ctx.beginPath();ctx.arc(20,ey2,er,0,Math.PI*2);ctx.clip();
    ctx.fillStyle='#0e0d0c';
    ctx.fillRect(20-er,ey2-er,er*2,er*2*(1-eyeH));
    ctx.fillRect(20-er,ey2+er*eyeH,er*2,er*2*(1-eyeH));
    ctx.beginPath();ctx.arc(20,ey2,er*eyeH,0,Math.PI*2);
    ctx.fillStyle='#050505';ctx.fill();
    if(eyeH>0.4){
      ctx.beginPath();ctx.arc(21,ey2-1,1*eyeH,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${.85*eyeH})`;ctx.fill();
    }
  } else {
    ctx.beginPath();ctx.moveTo(17,-14);ctx.lineTo(23,-14);
    ctx.strokeStyle='#3A8A6A';ctx.lineWidth=1.2;ctx.stroke();
  }
  ctx.restore();

  ctx.save();ctx.translate(26,-16);
  const bilGrad=ctx.createLinearGradient(0,0,42,0);
  bilGrad.addColorStop(0,'#F07800');bilGrad.addColorStop(.5,'#F8B800');
  bilGrad.addColorStop(.85,'#F9D040');bilGrad.addColorStop(1,'#E06000');
  ctx.beginPath();ctx.moveTo(0,-1);
  ctx.bezierCurveTo(10,-7,26,-8,42,-4);
  ctx.bezierCurveTo(44,-3,44,0,42,0);
  ctx.bezierCurveTo(26,2,10,-1,0,4);
  ctx.closePath();ctx.fillStyle=bilGrad;ctx.fill();
  ctx.beginPath();ctx.moveTo(0,4);
  ctx.bezierCurveTo(10,7,26,6,42,2);
  ctx.bezierCurveTo(42,4,26,9,10,8);
  ctx.bezierCurveTo(4,7,0,6,0,4);
  ctx.fillStyle='#C05800';ctx.fill();
  ctx.restore();

  ctx.beginPath();ctx.moveTo(-18,6);
  ctx.bezierCurveTo(-26,8,-34,14,-32,22);
  ctx.bezierCurveTo(-26,16,-18,12,-16,10);
  ctx.fillStyle='#0e0d0c';ctx.fill();

  ctx.restore();
}

function drawToucanFrame(){
  if(!toucan.active)return;
  const alpha=toucan.phase==='flying'||toucan.phase==='fleeing'
    ?clamp(toucan.flightT/20,0,1):1;
  drawToucan(toucan.x,toucan.y,SC(),toucan.flipX,toucan.wingT,alpha);
}

let allDoneChecked=false;
function checkAllDone(){
  if(allDoneChecked)return;
  if(branches.length<3)return;
  const allSettled=branches.every(b=>b.done||b.delay>120);
  const leavesGrown=leaves.filter(l=>l.grown).length;
  if(allSettled&&leavesGrown>leaves.length*.6){
    allDoneChecked=true;
    setTimeout(()=>launchToucan(),600);
  }
}

function init(){
  branches=[];leaves=[];pendingBranches=[];
  ticker=0;allDoneChecked=false;
  toucan.active=false;toucan.launched=false;toucan.phase='idle';
  toucan.perchBranch=null;toucan.blinking=false;toucan.eyeOpen=1;
  buildRoots();
}

function loop(){
  animId=requestAnimationFrame(loop);
  ticker++;
  if(pendingBranches.length){branches.push(...pendingBranches);pendingBranches=[];}
  ctx.clearRect(0,0,W,H);
  for(let i=0;i<branches.length;i++){branches[i].update();branches[i].draw();}
  for(let i=0;i<leaves.length;i++){leaves[i].update();leaves[i].draw();}
  updateToucan();
  drawToucanFrame();
  if(ticker%30===0)checkAllDone();
}

resize();
window.addEventListener('resize',()=>{resize();init();});
init();loop();
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)cancelAnimationFrame(animId);
  else{cancelAnimationFrame(animId);loop();}
});
})();
