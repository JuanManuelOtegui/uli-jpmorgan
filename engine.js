/* ════════════════════════════════════════════════════════════════
   URUGUAY LAND INVEST · FILM ENGINE  v2
   Jeder Schritt beschreibt einen vollständigen Zustand:
   Kamera, Bild, Licht, Karte, Text. Dadurch funktionieren
   Vor, Zurück und Springen immer gleich.
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const D = window.ULI, VW = D.vb[0], VH = D.vb[1];
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const NS='http://www.w3.org/2000/svg';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const easeIO=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut=t=>1-Math.pow(1-t,3);
const PRESENTER = location.hash.includes('presenter');

const F = window.FILM = {
  chapters:[], beats:[], idx:-1, polls:{},
  cam:{x:500,y:560,w:0,ax:.5,ay:.5}, tw:null, pins:[], started:false,
  occ:null, drift:true
};

/* ─── STORY-API ──────────────────────────────────────────────── */
F.chapter = function(ch){
  ch.n = F.chapters.length; ch.start = F.beats.length;
  ch.beats.forEach((b,i)=>{ b.ch=ch; b.local=i; F.beats.push(b); });
  F.chapters.push(ch);
};
F.marker = k => ({x:D.markers[k][0], y:D.markers[k][1]});

/* Zustände auflösen: fehlende Felder erben vom vorherigen Schritt.
   Eine gesetzte Kamera ist immer vollständig, sie erbt nichts. */
function resolve(){
  let prev = {cam:{x:500,y:560,z:1}, photo:null, veil:null, map:{}, lb:false, hud:false, mini:true, layout:'center', foot:null};
  F.beats.forEach(b=>{
    const r = {};
    r.cam    = b.cam    !== undefined ? Object.assign({}, b.cam) : prev.cam;
    r.photo  = b.photo  !== undefined ? b.photo  : prev.photo;
    r.veil   = b.veil   !== undefined ? b.veil   : (b.photo===null ? null : prev.veil);
    r.map    = b.map    !== undefined ? b.map    : prev.map;
    r.lb     = b.lb     !== undefined ? b.lb     : false;
    r.hud    = b.hud    !== undefined ? b.hud    : true;
    r.mini   = b.mini   !== undefined ? b.mini   : true;
    r.layout = b.layout || 'center';
    r.foot   = b.foot   !== undefined ? b.foot   : null;
    b.R = r; prev = r;
  });
}

/* ─── DOM-AUFBAU ────────────────────────────────────────────── */
function build(){
  document.body.insertAdjacentHTML('afterbegin', `
  <div id="stage">
    <div id="world"></div>
    <div id="pins" style="position:absolute;inset:0;pointer-events:none;z-index:2"></div>
    <div id="photos" style="z-index:3"><div class="ph" id="phA"><img alt=""></div><div class="ph" id="phB"><img alt=""></div></div>
    <div class="veil" id="veilA" style="z-index:4"></div><div class="veil" id="veilB" style="z-index:4"></div>
    <div id="vignette" style="z-index:4"></div>
    <div id="text"></div>
    <div id="panel" class="pe"><button class="px" aria-label="Cerrar">×</button><div class="pb"></div></div>
    <div id="foot"></div>
    <div id="prompter"><div class="pw"></div><div class="ps"></div><div class="pn2"></div></div>
    <div class="bar-lb" id="lbTop"></div><div class="bar-lb" id="lbBot"></div>
    <div id="grain" style="z-index:7"></div>
    <div id="hud">
      <div id="hudCh"></div>
      <img id="hudLogo" src="./logo.png" alt="">
      <svg id="mini" viewBox="0 0 ${VW} ${VH}"><path id="miniPath"></path><rect id="miniRect"></rect></svg>
      <div id="hudProg"><div class="fill"></div></div>
    </div>
    <div id="notes"><h4>Sprechernotiz</h4><div id="notesBody"></div></div>
    <div id="overview"><h3 data-i="ovh">Capítulos · clic para ir</h3><div id="ovGrid"></div></div>
    <div id="black"></div>
    <div id="toast"></div>
    <div id="gate">
      <img src="./logo.png" alt="Uruguay Land Invest">
      <p><b data-i="gatep">Presentación para inversores</b></p>
      <div class="load"><i></i></div>
      <p class="keys">
        <kbd>→</kbd> <span data-i="next">siguiente</span> &nbsp; <kbd>←</kbd> <span data-i="prev">atrás</span> &nbsp; <kbd>F</kbd> <span data-i="full">pantalla completa</span> &nbsp; <kbd>O</kbd> <span data-i="chapters">capítulos</span><br>
        <kbd>B</kbd> <span data-i="black">pantalla negra</span><br>
        <span id="gateGo" data-i="loading" style="color:var(--gold2)">Cargando …</span>
      </p>
    </div>
  </div>
  <div id="pv">
    <div id="pvTop"><div class="t" id="pvTime">00:00</div><div class="c" id="pvCount">–</div></div>
    <div id="pvNow"><h5>Jetzt</h5><div class="who" id="pvWho"></div><div class="ttl" id="pvNowT"></div><div class="say" id="pvSay"></div><div class="nt" id="pvNowN"></div><div id="pvPoll"></div></div>
    <div id="pvNext"><h5>Als Nächstes</h5><div class="who" id="pvWhoN"></div><div class="ttl" id="pvNextT"></div><div class="nt" id="pvNextN"></div></div>
    <div id="pvChat"><input id="pvChatIn" placeholder="Chat-Antwort einblenden (Enter) · bei Fragen an die Runde" autocomplete="off"></div>
    <div id="pvBtns">
      <button id="bPrev">Zurück</button><button class="pri" id="bNext">Weiter</button>
      <button id="bBlack">Schwarzbild</button><button id="bTimer">Timer neu</button>
      <button id="bLive">Live / Voll</button>
      <button data-p="1">Umfrage 1</button><button data-p="2">Umfrage 2</button><button data-p="3">Umfrage 3</button><button data-p="4">Umfrage 4</button><button data-p="0">Umfrage leeren</button>
    </div>
  </div>`);

  /* Karte */
  const svg = document.createElementNS(NS,'svg');
  svg.id='map'; svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
  svg.setAttribute('width',VW); svg.setAttribute('height',VH);
  let dPaths='', i=0; const allD=[];
  const order = Object.keys(D.depts).sort((a,b)=>centroid(D.depts[a]).y-centroid(D.depts[b]).y);
  order.forEach(k=>{ dPaths += `<path class="dept" data-d="${k}" style="--o:${i++}" d="${D.depts[k]}"/>`; allD.push(D.depts[k]); });
  svg.innerHTML = `
    <defs>
      <pattern id="deptTex" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(35)">
        <rect width="7" height="7" fill="#0e2418"/><line x1="0" y1="0" x2="0" y2="7" stroke="rgba(232,184,109,.055)" stroke-width="1.1"/>
      </pattern>
      <radialGradient id="areaGrad"><stop offset="0" stop-color="#E8B86D" stop-opacity=".42"/><stop offset="1" stop-color="#E8B86D" stop-opacity="0"/></radialGradient>
    </defs>
    <g id="gHalo"><path class="country-halo" d="${allD.join(' ')}"/></g>
    <g id="gDepts">${dPaths}</g>
    <g id="gGlow"><path class="country-glow" d="${allD.join(' ')}"/></g>
    <g id="gRoutes" class="off"></g>
    <g id="gArea" class="lyr off"></g>
    <g id="gArcs"></g>`;
  $('#world').appendChild(svg); if(F.onBuild) F.onBuild(svg);
  /* Hauptstraßen (schematisch, über Städte gelegt) */
  const P=n=>D.places[n]||(D.towns||{})[n];
  function chaikin(pts,it){ for(let k=0;k<it;k++){ const o=[pts[0]]; for(let i=0;i<pts.length-1;i++){ const p0=pts[i],p1=pts[i+1];
    o.push([p0[0]*.75+p1[0]*.25,p0[1]*.75+p1[1]*.25],[p0[0]*.25+p1[0]*.75,p0[1]*.25+p1[1]*.75]); } o.push(pts[pts.length-1]); pts=o; } return pts; }
  document.body.classList.toggle('show-rtnum', /rtnum/.test(location.search));
  $('#gRoutes').innerHTML=(D.routes||[]).map(r=>{ let raw=r.via.map(P).filter(Boolean).map(p=>[p.x,p.y]);
    let pts=raw.length>2?chaikin(raw,2):raw;
    const mid=raw[Math.floor((raw.length-1)/2)]||raw[0];
    return `<polyline class="route" points="${pts.map(p=>p[0]+','+p[1]).join(' ')}"/><text class="route-num" x="${mid[0]}" y="${mid[1]}">${r.n.replace('Ruta ','')}</text>`; }).join('');
  $('#miniPath').setAttribute('d', allD.join(' '));

  /* Pins: HTML über der Karte, immer scharf, konstante Größe */
  Object.entries(D.places).forEach(([n,p])=>addPin('place',n,p.x,p.y,
    `<div class="pn ${p.type}"><i></i><span>${n}</span></div>`));
  Object.keys(D.markers).forEach(k=>{
    const pr=D.props[k]; const [x,y]=D.markers[k];
    addPin('prop',k,x,y,`<div class="pp${pr.lside?' lft':''}"><i></i><div class="pl"><b>${pr.name}</b><span>${pr.area} · ${(pr.region||'').split('·')[0].trim()}</span><b class="haLbl">${pr.area}</b><span class="haLbl">Campo</span></div></div>`);
  });
  D.ops.forEach((o,j)=>addPin('op','op'+j,o.x,o.y,`<div class="po ${o.cat||o.sector}"><i style="--dl:${j*55}ms"></i><span class="on-lab">${o.short||''}</span></div>`,o.sector));
  const DN={'paysandu':'Paysandú','artigas':'Artigas','salto':'Salto','rivera':'Rivera','rocha':'Rocha','treinta-y-tres':'Treinta y Tres',
    'cerro-largo':'Cerro Largo','maldonado':'Maldonado','canelones':'Canelones','san-jose':'San José','colonia':'Colonia','soriano':'Soriano',
    'rio-negro':'Río Negro','tacuarembo':'Tacuarembó','durazno':'Durazno','flores':'Flores','florida':'Florida','lavalleja':'Lavalleja'};
  Object.keys(DN).forEach(k=>{ const c=polyCentroid(D.depts[k]); addPin('dlab',k,c.x,c.y,`<div class="dl">${DN[k]}</div>`); });
  Object.entries(D.towns||{}).forEach(([n,p])=>addPin('town',n,p.x,p.y,`<div class="pn town"><i></i><span>${n}</span></div>`));
}
/* Schwerpunkt der größten Teilfläche eines Departements */
function polyCentroid(d){
  let best=null;
  d.split(/(?=M)/).forEach(sub=>{
    const p=[]; sub.replace(/(-?[\d.]+),(-?[\d.]+)/g,(m,a,b)=>{p.push([+a,+b]);});
    if(p.length<3) return;
    let A=0,cx=0,cy=0;
    for(let i=0;i<p.length;i++){ const [x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length], f=x1*y2-x2*y1; A+=f; cx+=(x1+x2)*f; cy+=(y1+y2)*f; }
    A/=2; if(!best||Math.abs(A)>Math.abs(best.A)) best={A,x:cx/(6*A),y:cy/(6*A)};
  });
  return best||centroid(d);
}
function centroid(d){ let sx=0,sy=0,n=0; d.replace(/(-?[\d.]+),(-?[\d.]+)/g,(m,a,b)=>{sx+=+a;sy+=+b;n++;}); return {x:sx/n,y:sy/n}; }
function addPin(kind,key,x,y,html,sector){
  const el=document.createElement('div'); el.className='pin '+kind+' off'; el.dataset.key=key;
  if(sector) el.dataset.sector=sector;
  el._src=html; el.innerHTML=I18N.tr(html); $('#pins').appendChild(el);
  F.pins.push({el,x,y,kind,key,on:false});
}

/* ─── KAMERA ─────────────────────────────────────────────────── */
function vp(){ return {w:innerWidth,h:innerHeight}; }
function baseK(){ const v=vp(); return Math.min(v.w/VW, v.h/VH)*0.84; }
function camToView(c){ const v=vp(); if(c.km){ const h=c.km*2.0055; return {x:c.x,y:c.y,w:h*v.w/v.h,ax:c.ax,ay:c.ay}; } const k=baseK()*(c.z||1); return {x:c.x,y:c.y,w:v.w/k,ax:c.ax,ay:c.ay}; }
function defaultAnchor(layout){ return layout==='left'?[.68,.5]:layout==='right'?[.32,.5]:layout==='bottom'?[.5,.42]:layout==='top'?[.5,.6]:[.5,.5]; }

function interpolateZoom(p0,p1){
  const rho=Math.SQRT2,rho2=2,rho4=4,eps=1e-12;
  const [ux0,uy0,w0]=p0,[ux1,uy1,w1]=p1,dx=ux1-ux0,dy=uy1-uy0,d2=dx*dx+dy*dy;
  let S,fn;
  if(d2<eps){ S=Math.log(w1/w0)/rho; fn=t=>[ux0+t*dx,uy0+t*dy,w0*Math.exp(rho*t*S)]; }
  else{
    const d1=Math.sqrt(d2),
      b0=(w1*w1-w0*w0+rho4*d2)/(2*w0*rho2*d1), b1=(w1*w1-w0*w0-rho4*d2)/(2*w1*rho2*d1),
      r0=Math.log(Math.sqrt(b0*b0+1)-b0), r1=Math.log(Math.sqrt(b1*b1+1)-b1);
    S=(r1-r0)/rho;
    fn=t=>{ const s=t*S, c0=Math.cosh(r0), u=w0/(rho2*d1)*(c0*Math.tanh(rho*s+r0)-Math.sinh(r0));
      return [ux0+u*dx,uy0+u*dy,w0*c0/Math.cosh(rho*s+r0)]; };
  }
  fn.duration=Math.abs(S)*1000*rho/Math.SQRT2; return fn;
}
function flyTo(cam,layout,instant){
  const a = (cam.ax!=null&&cam.ay!=null)?[cam.ax,cam.ay]:defaultAnchor(layout);
  const tgt = camToView(Object.assign({},cam,{ax:a[0],ay:a[1]}));
  if(instant || !F.cam.w){ F.cam=Object.assign({},tgt); F.tw=null; return; }
  const same = Math.abs(tgt.x-F.cam.x)<.5 && Math.abs(tgt.y-F.cam.y)<.5 && Math.abs(tgt.w/F.cam.w-1)<.01
            && Math.abs(tgt.ax-F.cam.ax)<.005 && Math.abs(tgt.ay-F.cam.ay)<.005;
  if(same){ F.tw=null; return; }
  const ip = interpolateZoom([F.cam.x,F.cam.y,F.cam.w],[tgt.x,tgt.y,tgt.w]);
  const dur = cam.dur || clamp(ip.duration*.95, 1300, 2600);
  F.tw = {t0:performance.now(), dur, ip, ax0:F.cam.ax, ax1:tgt.ax, ay0:F.cam.ay, ay1:tgt.ay, end:tgt};
}
let fnEls=[];
function camFrame(now){
  if(F.tw){
    const t=clamp((now-F.tw.t0)/F.tw.dur,0,1), e=easeIO(t), [x,y,w]=F.tw.ip(e);
    F.cam={x,y,w,ax:lerp(F.tw.ax0,F.tw.ax1,e),ay:lerp(F.tw.ay0,F.tw.ay1,e)};
    if(t>=1){ F.cam=Object.assign({},F.tw.end); F.tw=null; }
  }
  const v=vp(), s=now/1000, dr=F.drift?1:0;
  const bx = Math.sin(s*.061)*F.cam.w*.0035*dr, by = Math.cos(s*.047)*F.cam.w*.0028*dr;
  const k = v.w/F.cam.w * (1 + Math.sin(s*.083)*.006*dr);
  const cx=F.cam.x+bx, cy=F.cam.y+by;
  const tx=F.cam.ax*v.w - cx*k, ty=F.cam.ay*v.h - cy*k;
  F.k=k; F.tx=tx; F.ty=ty;
  (camFrame._w||(camFrame._w=$('#world'))).style.transform=`translate3d(${tx}px,${ty}px,0) scale(${k})`;
  const arcs=$('#gArcs'); if(arcs) arcs.setAttribute('stroke-width',(2.4/k).toFixed(3));
  const o=F.occ;
  for(const p of F.pins){
    if(!p.on) continue;
    const sx=p.x*k+tx, sy=p.y*k+ty;
    p.el.style.transform=`translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;
    const hide = !!(o && sx>o.l && sx<o.r && sy>o.t && sy<o.b);
    if(hide!==p._occ){ p._occ=hide; p.el.style.visibility=hide?'hidden':''; }
  }
  if(F.onFrame) F.onFrame(k,tx,ty,!!F.tw);
  const circ=[];
  for(const el of fnEls){ const fx=el._x*k+tx, fy=el._y*k+ty; el.style.transform=`translate3d(${fx.toFixed(1)}px,${fy.toFixed(1)}px,0)`;
    const d=el.firstElementChild||el; circ.push([fx,fy,(d.offsetWidth||0)/2+16]); }
  /* Orts- und Städtenamen unter einem Formel-Kreis ausblenden */
  if(circ.length) for(const p of F.pins){
    if(!p.on||(p.kind!=='place'&&p.kind!=='town')) continue;
    const sx=p.x*k+tx, sy=p.y*k+ty, under=circ.some(c=>Math.hypot(sx-c[0],sy-c[1])<c[2]);
    if(under){ p._occ=true; p.el.style.visibility='hidden'; }
  }
  /* Abnehmernamen, die sich überlappen, zeilenweise versetzen */
  const nm=F.pins.filter(p=>p.on&&p.kind==='op'&&p.el.classList.contains('named'));
  if(nm.length){
    const boxes=[], qs=nm.map(p=>({p,sx:p.x*k+tx,sy:p.y*k+ty}));
    qs.forEach(q=>{ q.dot={l:q.sx-8,r:q.sx+8,t:q.sy-8,b:q.sy+8}; boxes.push(q.dot); });
    qs.sort((a,b)=>a.sy-b.sy).forEach(q=>{
      const lab=q.p._lab||(q.p._lab=q.p.el.querySelector('.on-lab'));
      const w=lab.offsetWidth||60, h=(lab.offsetHeight||16)+2;
      let dy=0;
      for(const t of [0,1,-1,2,-2,3]){ dy=t*h;
        const b={l:q.sx+10,r:q.sx+14+w,t:q.sy+dy-h/2,b:q.sy+dy+h/2};
        if(!boxes.some(o=>o!==q.dot&&b.l<o.r&&b.r>o.l&&b.t<o.b&&b.b>o.t)){ boxes.push(b); break; } }
      if(q.p._dy!==dy){ q.p._dy=dy; lab.style.transform=`translateY(calc(-50% + ${dy}px))`; }
    });
  }
  const r=camFrame._r||(camFrame._r=$('#miniRect')), vwU=v.w/k, vhU=v.h/k;
  r.setAttribute('x',cx-F.cam.ax*vwU); r.setAttribute('y',cy-F.cam.ay*vhU);
  r.setAttribute('width',vwU); r.setAttribute('height',vhU);
  requestAnimationFrame(camFrame);
}

/* ─── FOTO ───────────────────────────────────────────────────── */
let phCur=null, phSlot='A';
function setPhoto(p){
  const A=$('#phA'),B=$('#phB');
  if(!p){ A.classList.remove('on'); B.classList.remove('on'); phCur=null; return; }
  const key=p.src+'|'+(p.from||'')+'|'+(p.iris?'i':'');
  const cur = phSlot==='A'?A:B;
  if(phCur===key || (phCur && phCur.split('|')[0]===p.src && p.keep)){ cur.style.setProperty('--op',p.op!=null?p.op:1); return; }
  const nxt = phSlot==='A'?B:A; const img=$('img',nxt);
  const [s0,x0,y0]=p.from||[1.10,0,0], [s1,x1,y1]=p.to||[1.0,0,0];
  img.style.transition='none';
  img.style.transform=`scale(${s0}) translate(${x0}%,${y0}%)`;
  img.style.objectPosition=p.pos||'center';
  img.src='./'+p.src;
  nxt.style.transition='none';
  nxt.style.clipPath = p.iris ? 'circle(0px at 50% 50%)' : 'none';
  void img.offsetWidth;
  img.style.transition=`transform ${p.dur||22}s linear`;
  img.style.transform=`scale(${s1}) translate(${x1}%,${y1}%)`;
  nxt.style.setProperty('--op',p.op!=null?p.op:1);
  nxt.style.webkitMaskImage=nxt.style.maskImage=p.mask||'none';
  if(p.iris){
    nxt.classList.add('on');
    F.later(()=>{ nxt.style.transition='clip-path 1.8s cubic-bezier(.7,0,.25,1)'; nxt.style.clipPath='circle(80% at 50% 50%)'; }, p.iris);
    F.later(()=>{ nxt.style.transition=''; }, p.iris+1900);
  } else { void nxt.offsetWidth; nxt.style.transition=''; nxt.classList.add('on'); }
  cur.classList.remove('on');
  phSlot = phSlot==='A'?'B':'A'; phCur=key;
}
F.setPhoto = setPhoto;

const VEILS={
  left:'linear-gradient(90deg,rgba(3,8,5,.9) 0%,rgba(3,8,5,.66) 38%,rgba(3,8,5,.12) 72%,rgba(3,8,5,0) 100%)',
  right:'linear-gradient(270deg,rgba(3,8,5,.9) 0%,rgba(3,8,5,.66) 38%,rgba(3,8,5,.12) 72%,rgba(3,8,5,0) 100%)',
  bottom:'linear-gradient(0deg,rgba(3,8,5,.92) 0%,rgba(3,8,5,.55) 42%,rgba(3,8,5,.05) 80%)',
  full:'rgba(3,8,5,.64)', soft:'rgba(3,8,5,.38)', deep:'rgba(3,8,5,.8)', night:'rgba(2,6,4,.93)',
  center:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(3,8,5,.78) 0%,rgba(3,8,5,.4) 60%,rgba(3,8,5,.15) 100%)'
};
let veilCur=null, veilSlot='A';
function setVeil(v){
  if(v===veilCur) return;
  const A=$('#veilA'),B=$('#veilB'), cur=veilSlot==='A'?A:B, nxt=veilSlot==='A'?B:A;
  veilCur=v;
  if(!v){ A.style.opacity=0; B.style.opacity=0; return; }
  nxt.style.background=VEILS[v]||v; nxt.style.opacity=1; cur.style.opacity=0;
  veilSlot = veilSlot==='A'?'B':'A';
}

/* ─── KARTE ──────────────────────────────────────────────────── */
function setMap(m){
  m=m||{};
  const svg=$('#map');
  const hi = m.hi||[], lit=m.lit||[];
  $$('.dept').forEach(p=>{
    const d=p.dataset.d;
    p.classList.toggle('hi', hi==='all' || hi.includes(d));
    p.classList.toggle('lit', lit.includes(d));
    p.classList.toggle('dim', !!m.dimOthers && !(hi==='all'||hi.includes(d)||lit.includes(d)));
    if(m.heat){ p.classList.add('heat'); p.style.setProperty('--h',m.heat[d]||0); } else { p.classList.remove('heat'); p.style.removeProperty('--h'); }
  });
  svg.classList.remove('drought');
  svg.classList.remove('sweep'); if(m.sweep){ void svg.getBoundingClientRect(); svg.classList.add('sweep'); }
  $('.country-glow').classList.toggle('on', m.glow!==false);
  $('#gRoutes').classList.toggle('off', !m.routes);
  svg.classList.toggle('flat', !!m.routes);
  $('.country-halo').classList.toggle('on', m.glow!==false);
  const W=$('#world'); W.style.transition='opacity 1.2s ease'; W.style.opacity = m.hide?0:(m.op!=null?m.op:1);
  // Pins
  const fnAt = (m.fnodes||[]).map(n=>typeof n.at==='string'?n.at:null).filter(Boolean);
  const places = (m.places==='all'?Object.keys(D.places):(m.places||[])).filter(p=>!fnAt.includes(p));
  const hlp = m.hlPlaces||[];
  const props = m.props==='all'?Object.keys(D.markers):(m.props||[]);
  const ops = m.ops;
  F.pins.forEach(p=>{
    let on=false;
    if(p.kind==='place'){ on=places.includes(p.key); p.el.classList.toggle('hl',hlp.includes(p.key)); }
    if(p.kind==='dlab') on=!!m.depts && !(Array.isArray(m.depts) && !m.depts.includes(p.key));
    if(p.kind==='town') on=m.towns==='all' || (Array.isArray(m.towns) && m.towns.includes(p.key));
    if(p.kind==='prop'){ on=props.includes(p.key); p.el.classList.toggle('nolabel', m.propLabels===false);
      p.el.classList.toggle('ha', m.propLabels==='ha');
      p.el.classList.toggle('big', m.focusProp===p.key); }
    if(p.kind==='op'){
      const o=D.ops[+p.key.slice(2)];
      on = m.opsNamed ? m.opsNamed.includes(o.short) : (ops==='all' || (typeof ops==='string' && p.el.dataset.sector===ops) || (Array.isArray(ops)&&ops.includes(p.el.dataset.sector)));
      p.el.classList.toggle('named', !!m.opsNamed && on);
      p.el.classList.toggle('faint', !!m.opsFaint && on);
      if(on && !p.on){ const ii=$('.po i',p.el); ii.style.animation='none'; void ii.offsetWidth; ii.style.animation=''; }
    }
    p.on=on; p.el.classList.toggle('off',!on);
    if(!on){ p._occ=false; p.el.style.visibility=''; }
  });
  // Fläche
  const ga=$('#gArea');
  if(m.area){
    const {x,y}=typeof m.area==='string'?F.marker(m.area):m.area, R=m.areaR||26;
    ga.innerHTML=`<circle class="area-soft" cx="${x}" cy="${y}" r="${R*3.2}"/>
      <circle class="area-ring" cx="${x}" cy="${y}" r="${R}"/><circle class="area-ring r2" cx="${x}" cy="${y}" r="${R*1.9}"/>
      <circle class="area-core" cx="${x}" cy="${y}" r="${R*.14}"/>`;
    ga.classList.remove('off'); ga.classList.toggle('drained', !!m.areaDim);
  } else ga.classList.add('off');
  // Bögen: vorhandene bleiben stehen, nur neue werden gezeichnet
  const g=$('#gArcs'), want={};
  const ak = p=>typeof p==='string'?p:(p.x+','+p.y);
  (m.arcs||[]).forEach(a=>{ want[ak(a[0])+'>'+ak(a[1])]=a; });
  $$('path',g).forEach(p=>{ if(!want[p.dataset.k]) p.remove(); else delete want[p.dataset.k]; });
  Object.values(want).forEach((a,i)=>{
    const A=pt(a[0]),B=pt(a[1]); if(!A||!B) return;
    const mx=(A.x+B.x)/2, my=(A.y+B.y)/2, dx=B.x-A.x, dy=B.y-A.y, bend=(a[3]!=null?a[3]:.22);
    const cx=mx-dy*bend, cy=my+dx*bend;
    const p=document.createElementNS(NS,'path');
    p.dataset.k=ak(a[0])+'>'+ak(a[1]);
    p.setAttribute('d',`M${A.x},${A.y} Q${cx},${cy} ${B.x},${B.y}`);
    p.setAttribute('pathLength','1');
    p.style.cssText=`stroke-dasharray:1 1;stroke-dashoffset:1;animation:drawArc 1.7s var(--ease) ${400+i*260}ms forwards;fill:none;stroke-linecap:round;opacity:.9;stroke:${(a[2]||'').includes('cool')?'#9fd3ff':'#E8B86D'}`;
    g.appendChild(p);
  });
  // Formel-Knoten
  fnEls.forEach(e=>e.remove()); fnEls=[];
  (m.fnodes||[]).forEach(n=>{
    const P=pt(n.at); if(!P) return;
    const el=document.createElement('div');
    el.className='fn'+(n.fresh?' fresh':' on')+(n.dim?' dim':'');
    el._x=P.x+(n.dx||0); el._y=P.y+(n.dy||0);
    el.innerHTML=`<div class="disc${n.img?' logo':''}">${n.img?`<img src="./${n.img}" alt="">`:`<b>${n.t}</b><span>${n.s||''}</span>`}</div>${n.cap?`<div class="cap">${n.cap}</div>`:''}`;
    $('#pins').appendChild(el); fnEls.push(el);
    if(n.fresh){ requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on'))); }
  });
}
function pt(a){
  if(typeof a==='object') return a;
  if(D.places[a]) return D.places[a];
  if(D.markers[a]) return F.marker(a);
  return null;
}

/* ─── TEXT ───────────────────────────────────────────────────── */
function splitWords(el){
  let i=0;
  const walk=node=>{
    [...node.childNodes].forEach(n=>{
      if(n.nodeType===3){
        const parts=n.textContent.split(/(\s+)/), frag=document.createDocumentFragment();
        parts.forEach(p=>{ if(!p) return;
          if(/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else { const s=document.createElement('span'); s.className='w'; s.style.setProperty('--i',i++); s.textContent=p; frag.appendChild(s); } });
        n.replaceWith(frag);
      } else if(n.nodeType===1 && n.tagName!=='BR' && !n.classList.contains('w')) walk(n);
    });
  };
  walk(el); return i;
}
function fmt(v,dec){ return v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}); }
function countUp(el){
  const to=parseFloat(el.dataset.count), dec=+(el.dataset.dec||0), dur=+(el.dataset.dur||1700), del=+(el.dataset.cd||200);
  if(el.closest('.stay')){ el.textContent=fmt(to,dec); return; }
  el.textContent=fmt(0,dec);
  const t0=performance.now()+del;
  const step=now=>{ const t=clamp((now-t0)/dur,0,1); el.textContent=fmt(to*easeOut(t),dec); if(t<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function activate(root,beat){
  $$('.kin',root).forEach(el=>{ if(!$('.w',el)) splitWords(el); });
  const go=()=>{
    if(F.beats[F.idx]!==beat) return;
    $$('.kin,.rev,.tl,.inter,.race',root).forEach(e=>e.classList.add('in'));
    $$('[data-w]',root).forEach(e=>e.style.width=e.dataset.w+'%');
    $$('[data-h]',root).forEach(e=>e.style.height=e.dataset.h+'%');
    $$('.pill.struck',root).forEach(e=>e.classList.add('cut'));
    $$('[data-count]',root).forEach(countUp);
    if(beat.poll) paintPoll();
    if(beat.after) beat.after(root,F);
    measureOcc(root);
  };
  requestAnimationFrame(()=>requestAnimationFrame(go));
}
/* Verdeckung: nur die Fläche, die Text und Karten wirklich belegen, nicht die volle Spaltenbreite */
function measureOcc(root){
  const col=root && $('.col',root); if(!col){ F.occ=null; return; }
  let l=1e9,t=1e9,r=-1e9,b=-1e9;
  const add=q=>{ if(!q.width||!q.height) return; l=Math.min(l,q.left); t=Math.min(t,q.top); r=Math.max(r,q.right); b=Math.max(b,q.bottom); };
  const tw=document.createTreeWalker(col,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.trim()?1:3});
  const rg=document.createRange();
  while(tw.nextNode()){ rg.selectNodeContents(tw.currentNode); [...rg.getClientRects()].forEach(add); }
  $$('.card,.pill,.popt,.risk,button,img,.strip,.cf,.bar,.wf .bw,.race,.tl',col).forEach(x=>add(x.getBoundingClientRect()));
  const pad=18;
  F.occ = r>l ? {l:l-pad, r:r+pad, t:t-pad, b:b+pad} : null;
}
function setText(beat){
  const host=$('#text');
  $$('.comp.leaving',host).forEach(c=>c.remove());
  const live=$$('.comp',host); live.slice(0,-1).forEach(c=>c.remove());
  const cur=live[live.length-1];
  const html = I18N.tr(typeof beat.html==='function'?beat.html(F):(beat.html||''));
  if(beat.hold && cur && cur.dataset.ch===String(beat.ch.n)){
    cur.innerHTML=html; cur.className='comp '+beat.R.layout; activate(cur,beat); fitComp(cur); return;
  }
  if(cur){ cur.classList.add('leaving'); setTimeout(()=>cur.remove(),320); }
  const c=document.createElement('div'); c.className='comp '+beat.R.layout; c.dataset.ch=beat.ch.n; c.innerHTML=html;
  host.appendChild(c); activate(c,beat); fitComp(c);
}
/* Passt der Text nicht aufs Fenster (z. B. hohes oder kleines Fenster), wird die Spalte verkleinert statt abgeschnitten */
function fitComp(c){
  if(!c||!c.isConnected) return;
  const cs=getComputedStyle(c), avail=c.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
  [...c.children].forEach(col=>{
    if(getComputedStyle(col).position==='absolute') return;
    col.style.zoom=''; const h=col.scrollHeight;
    if(h>avail && avail>100) col.style.zoom=Math.max(.6,(avail/h)*.98).toFixed(3);
  });
}
addEventListener('resize',()=>{ clearTimeout(fitComp._t); fitComp._t=setTimeout(()=>$$('#text .comp:not(.leaving)').forEach(fitComp),200); });

/* ─── UMFRAGE ────────────────────────────────────────────────── */
F.pollHTML = function(id,opts){
  return `<div class="poll pe" data-poll="${id}">`+opts.map((o,i)=>`
    <div class="popt" data-i="${i}"><div class="k">${i+1}</div><div class="t"><div class="f"></div><div class="l">${o}</div></div><div class="n">0</div></div>`).join('')
    +`</div>`;
};
F.pollWinner = function(id){ const c=F.polls[id]; if(!c) return -1; const mx=Math.max(...c); return mx>0?c.indexOf(mx):-1; };
F.pollTotal = id => (F.polls[id]||[]).reduce((a,b)=>a+b,0);
function paintPoll(){
  const b=F.beats[F.idx]; if(!b||!b.poll) return;
  const id=b.poll, c=F.polls[id]||(F.polls[id]=[0,0,0,0]);
  const tot=c.reduce((a,b)=>a+b,0), mx=Math.max(1,...c);
  $$(`[data-poll="${id}"] .popt`).forEach(o=>{
    const i=+o.dataset.i, n=c[i]||0;
    $('.f',o).style.width=(tot?n/mx*100:0)+'%';
    $('.n',o).textContent = tot? `${n} · ${Math.round(n/tot*100)}%` : '0';
    o.classList.toggle('lead', tot>0 && n===mx);
  });
  const live=$('.poll-live'); if(live) live.classList.toggle('on', tot===0);
  broadcast();
}
function pollKey(k,dec){
  const b=F.beats[F.idx]; if(!b||!b.poll) return;
  const c=F.polls[b.poll]||(F.polls[b.poll]=[0,0,0,0]);
  if(k===0) F.polls[b.poll]=[0,0,0,0];
  else if(k<=b.pollN) c[k-1]=Math.max(0,c[k-1]+(dec?-1:1));
  paintPoll();
}

/* ─── CHAT-WAND ──────────────────────────────────────────────── */
function chatShow(text){
  const wall=$('#text .comp:last-child .chatwall'); if(!wall||!text) return;
  const s=document.createElement('span'); s.className='chip'; s.textContent=text.slice(0,60);
  s.style.setProperty('--r',(Math.random()*6-3).toFixed(1)+'deg');
  wall.appendChild(s);
  requestAnimationFrame(()=>requestAnimationFrame(()=>s.classList.add('in')));
}

/* ─── ERKUNDEN: Betreiber und Flächen anklicken ───────────────── */
const esc = s=>String(s==null?'':s).replace(/&(?!amp;)/g,'&amp;').replace(/</g,'&lt;');
F.sel = null;
function openPanel(html){
  $('#panel .pb').innerHTML = I18N.tr(html);
  document.body.classList.add('panel-open');
  $('#panel').scrollTop = 0;
}
function closePanel(quiet){
  const was = F.sel; F.sel = null;
  document.body.classList.remove('panel-open');
  $$('.pin.sel').forEach(p=>p.classList.remove('sel'));
  const b=F.beats[F.idx];
  if(quiet){ if(was && was.kind==='field' && F.onFieldClose) F.onFieldClose(true); return; }
  if(was && was.kind==='field' && F.onFieldClose) F.onFieldClose(false);
  else if(was && was.kind==='prop' && b){ flyTo(b.R.cam,b.R.layout); setMap(b.R.map); }
}
F.closePanel = ()=>closePanel();
F.flyTo=flyTo; F.setMap=setMap; F.openPanel=openPanel; F.carStep=carStep;
const SECT = {Forestry:'Forestry',Agriculture:'Agriculture',Livestock:'Livestock',Meat:'Meat processing'};
function openOp(j){
  const o=D.ops[j]; if(!o) return;
  F.sel={kind:'op',j};
  $$('.pin.op').forEach(p=>p.classList.toggle('sel', p.dataset.key==='op'+j));
  let host=''; try{ host=o.source?new URL(o.source).hostname.replace(/^www\./,''):''; }catch(e){}
  const chipCat = o.cat||o.sector;
  openPanel(`<span class="chip ${chipCat}">${SECT[chipCat]||chipCat}</span>
    <h3>${esc(o.name)}</h3><div class="pfn">${esc(o.fn)}</div>
    <div class="pfit"><b>Fit for ULI investors</b>${esc(o.fit)}</div>
    <div class="prow"><b>What they do</b>${esc(o.use)}</div>
    <div class="prow"><b>Scale</b>${esc(o.size)}</div>
    <div class="prow"><b>Location</b>${esc(o.loc)}</div>
    ${host?`<div class="psrc">Public source · ${esc(host)}</div>`:''}
    <div class="pnote">Mapped by ULI from public information. No partnership or contract implied.</div>`);
}
let carI=0;
function openProp(key){
  const p=D.props[key], m=D.markers[key]; if(!p||!m) return;
  F.sel={kind:'prop',key}; carI=0;
  $$('.pin.prop').forEach(e=>e.classList.toggle('sel', e.dataset.key===key));
  flyTo({x:m[0],y:m[1],z:6,ax:.68,ay:.5,dur:2200},'left');
  // Radar: Entfernungsringe um die Fläche
  const ga=$('#gArea'), k=baseK()*6, fs=(13/k).toFixed(2);
  ga.innerHTML = (p.radar||[]).map(r=>`<circle class="area-ring" cx="${m[0]}" cy="${m[1]}" r="${r[0]*.55}"/>
    <text class="radar-t" x="${m[0]}" y="${m[1]-r[0]*.55-1.5}" font-size="${fs}" text-anchor="middle">${esc(r[1])}</text>`).join('')
    + `<circle class="area-core" cx="${m[0]}" cy="${m[1]}" r="1.6"/>`;
  ga.classList.remove('off','drained');
  const imgs=p.imgs||[];
  const stats=[['Area',p.area],['Price',p.price],['Total',p.total],['CONEAT',p.coneat],['Return',p.yield]]
    .map(s=>`<div><span>${esc(s[1])}</span><label>${s[0]}</label></div>`).join('');
  openPanel((imgs.length?`<div class="car">${imgs.map((s,i)=>`<img class="${i?'':'on'}" src="./${s}" alt="">`).join('')}
      ${imgs.length>1?`<button class="ca prev" aria-label="Anterior">‹</button><button class="ca next" aria-label="Siguiente">›</button><div class="cc">1 / ${imgs.length}</div>`:''}</div>`:`<div class="car nophoto"><span>Photos and exact location after NDA</span></div>`)+`
    <div class="preg">${esc(p.region)}</div><h3>${esc(p.name)}</h3><div class="pfn">${esc(p.use)}</div>
    <div class="pstats">${stats}</div>
    <div class="prow"><b>Operation</b>${esc(p.operation)}</div>
    <ul class="phl">${(p.hl||[]).map(h=>`<li>${esc(h)}</li>`).join('')}</ul>
    <div class="prow"><b>Water</b>${p.water}</div><div class="prow"><b>Access</b>${esc(p.access)}</div>
    <div class="pnote">Seller-reported, pre-NDA. Prices are owners' asking prices and are negotiated. Exact location, full report and model after NDA.</div>`);
}
function carStep(d){
  const im=$$('#panel .car img'); if(im.length<2) return;
  carI=(carI+d+im.length)%im.length;
  im.forEach((e,i)=>e.classList.toggle('on',i===carI));
  const c=$('#panel .cc'); if(c) c.textContent=(carI+1)+' / '+im.length;
}
function wireExplore(){
  $('#pins').addEventListener('click',e=>{
    const pin=e.target.closest('.pin'); if(!pin) return;
    e.stopPropagation();
    const b=F.beats[F.idx]; if(!b||!b.explore) return;
    if(pin.classList.contains('op') && b.explore==='ops') openOp(+pin.dataset.key.slice(2));
    if(pin.classList.contains('prop') && b.explore==='props') openProp(pin.dataset.key);
    if(pin.classList.contains('prop') && b.explore==='fields' && F.openField) F.openField(pin.dataset.key);
  });
  $('#panel').addEventListener('click',e=>{
    e.stopPropagation();
    if(e.target.closest('.px')) return closePanel();
    if(e.target.closest('.ca.prev')) return carStep(-1);
    if(e.target.closest('.ca.next')||e.target.closest('.car img')) return carStep(1);
  });
  // Vertiefungen (data-more), Kapitelsprung (data-jump), Sektorfilter (data-filter)
  $('#text').addEventListener('click',e=>{
    const mo=e.target.closest('[data-more]');
    if(mo){ e.stopPropagation(); openMore(mo.dataset.more); return; }
    const j=e.target.closest('[data-jump]');
    if(j){ e.stopPropagation(); show(+j.dataset.jump); return; }
    const f=e.target.closest('[data-filter]'); if(!f) return;
    e.stopPropagation();
    const s=f.dataset.filter;
    $$('[data-filter]').forEach(x=>x.classList.toggle('on',x===f));
    closePanel(true);
    F.pins.forEach(p=>{ if(p.kind!=='op') return;
      const on = s==='all' || p.el.dataset.sector===s;
      p.on=on; p.el.classList.toggle('off',!on); if(!on){ p._occ=false; p.el.style.visibility=''; } });
  });
}
F.openOp=openOp; F.openProp=openProp;
F.more = F.more || {};
function openMore(key){
  const m=F.more[key]; if(!m) return;
  F.sel={kind:'more',key};
  openPanel(`<div class="preg">En detalle</div><h3>${m.t}</h3><div class="mbody">${m.h}</div>${m.s?`<div class="pnote">${m.s}</div>`:''}`);
}
F.openMore=openMore;

/* ─── SCHRITT ANZEIGEN ───────────────────────────────────────── */
function show(i,instant){
  if(F._tick){ clearInterval(F._tick); F._tick=null; }
  (F._timers||[]).forEach(clearTimeout); F._timers=[];
  closePanel(true);
  i=clamp(i,0,F.beats.length-1);
  const b=F.beats[i]; F.idx=i;
  const R=b.R;
  document.body.classList.toggle('x-ops', b.explore==='ops');
  document.body.classList.toggle('x-props', b.explore==='props'||b.explore==='fields');
  document.body.classList.toggle('letterbox',!!R.lb);
  document.body.classList.toggle('nohud',!R.hud);
  document.body.classList.toggle('nomini',!R.mini);
  F.occ=null;
  flyTo(R.cam,R.layout,instant);
  setPhoto(R.photo); setVeil(R.veil); setMap(R.map); setText(b);
  const ft=$('#foot'); ft.innerHTML=I18N.tr(R.foot||''); ft.classList.toggle('on',!!R.foot);
  const ch=b.ch;
  $('#hudCh').innerHTML = ch.roman?`<b>${ch.roman}</b> ${I18N.tr(ch.title)}`:I18N.tr(ch.title||'');
  $('#hudProg .fill').style.width=((i+1)/F.beats.length*100)+'%';
  const sp=(F.SPEAKERS||{})[b.who];
  paintPrompter(b);
  $('#notesBody').innerHTML = (sp?`<div class="nwho" style="color:${sp.color}">${sp.name}${b.opt?' · optional':''}</div>`:'')+(b.say?`<div class="nsay">${b.say}</div>`:'')+(b.notes||'');
  $$('.ovc').forEach(e=>e.classList.toggle('cur', +e.dataset.i===ch.n));
  broadcast();
}
F.live = /[?&]live/.test(location.search);
function step(from,dir){ const n=F.beats.length; let i=from+dir; while(F.live && i>=0 && i<n && F.beats[i].opt) i+=dir; return (i<0||i>=n)?from:i; }
F.next=()=>show(step(F.idx,1)); F.prev=()=>show(step(F.idx,-1)); F.go=n=>show(n);
/* Probe-Modus: Sprechtext als Untertitel (nur zum Üben, Taste T) */
function paintPrompter(b){
  const P=$('#prompter'); if(!P||!b) return;
  const SP=F.SPEAKERS||{}, s=SP[b.who], n=F.beats[step(F.idx,1)];
  const ns=n&&n!==b&&SP[n.who];
  $('.pw',P).innerHTML = s?`<i style="background:${s.color}"></i>${s.name}${b.opt?' <em>optional</em>':''}<span>${F.idx+1} / ${F.beats.length}</span>`:'';
  $('.ps',P).textContent = b.say||'';
  $('.pn2',P).innerHTML = ns?`Danach: <b style="color:${ns.color}">${ns.name}</b>${n.who!==b.who?' · Übergabe':''}`:'';
}
F.setProbe=on=>{ document.body.classList.toggle('probe',on); toast(on?'<b>Probe-Modus</b><br>Sprechtext unten eingeblendet · T blendet aus':'Probe-Modus aus',1800); };
F.setLive=on=>{ F.live=on; toast(on?'<b>Live-Modus</b><br>Vertiefende Schritte werden übersprungen':'<b>Vollfassung</b><br>Alle Schritte',1800); broadcast(); };
/* geplante Zeit bis zu diesem Schritt, nur Live-Pfad */
function planAt(i){ let s=0; for(let k=0;k<i;k++){ const b=F.beats[k]; if(!b.opt || !F.live) s+=(b.t||0); } return s; }
F.later=(fn,ms)=>{ (F._timers||(F._timers=[])).push(setTimeout(fn,ms)); };

/* ─── SPRECHERFENSTER ───────────────────────────────────────── */
let chan=null; try{ chan=new BroadcastChannel('uli-film'); }catch(e){}
function send(msg){ if(chan) chan.postMessage(msg); try{ localStorage.setItem('uli-film-msg',JSON.stringify(Object.assign({ts:Date.now()},msg))); }catch(e){} }
function beatTitle(b){ return b?((b.ch.roman?b.ch.roman+' · ':'')+b.ch.title+'  ·  '+(b.label||'')):'Ende'; }
/* Sprecher-Link: Schrittnummer an alle Sprecher (nur Nummer, kein Inhalt) */
let relayT=null;
function relay(){
  if(PRESENTER || !F.SYNC_TOPIC || !F.started) return;
  if(!/[?&](live|probe|sync)\b/.test(location.search)) return;   /* nur im Webinar- oder Probe-Start senden, nie bei Tests */
  clearTimeout(relayT);
  relayT=setTimeout(()=>{ try{ fetch('https://ntfy.sh/'+F.SYNC_TOPIC,{method:'POST',body:JSON.stringify({i:F.idx,n:F.beats.length,live:F.live,ts:Date.now()})}).catch(()=>{}); }catch(x){} },350);
}
function broadcast(){
  if(PRESENTER) return;
  relay();
  const b=F.beats[F.idx], n=F.beats[step(F.idx,1)]!==b?F.beats[step(F.idx,1)]:null, SP=F.SPEAKERS||{};
  const wn=x=>x&&x.who&&SP[x.who]?{n:SP[x.who].name,c:SP[x.who].color}:null;
  send({type:'state', idx:F.idx, total:F.beats.length, started:F.started, live:F.live,
    who:wn(b), whoNext:wn(n), handover:!!(b&&n&&b.who&&n.who&&b.who!==n.who), say:b?b.say||'':'', plan:planAt(F.idx), t:b?b.t||0:0,
    title:beatTitle(b), notes:b?b.notes||'':'', nextTitle:beatTitle(n), nextNotes:n?n.notes||'':'',
    chat:!!(b&&b.chat), poll:b&&b.poll?(F.polls[b.poll]||[0,0,0,0]).slice(0,b.pollN):null});
}
let pvT0=0, pvPlan=0, pvLive=false;
function onMsg(m){
  if(!m||!m.type) return;
  if(PRESENTER){
    if(m.type!=='state') return;
    $('#pvCount').textContent= m.started?`Schritt ${m.idx+1} / ${m.total}`:'Noch nicht gestartet';
    $('#pvNowT').textContent=m.title; $('#pvNowN').innerHTML=m.notes; $('#pvSay').textContent=m.say||'';
    const W=(el,w,pre)=>{ el.innerHTML=w?`<i style="background:${w.c}"></i>${pre||''}${w.n}`:''; };
    W($('#pvWho'),m.who,'Spricht: '); W($('#pvWhoN'),m.whoNext,m.handover?'Übergabe an ':'Weiter: ');
    $('#pvWhoN').classList.toggle('hand',!!m.handover);
    pvPlan=m.plan; pvLive=m.live; $('#bLive').textContent=m.live?'Live-Modus an':'Vollfassung';
    $('#pvNextT').textContent=m.nextTitle; $('#pvNextN').innerHTML=m.nextNotes;
    $('#pvPoll').textContent = m.poll?('Umfrage   '+m.poll.map((v,i)=>(i+1)+': '+v).join('   ·   ')):'';
    $('#pvChat').classList.toggle('on',!!m.chat);
    if(m.idx>0 && !pvT0) pvT0=Date.now();
  } else {
    if(m.type!=='cmd') return;
    if((m.cmd==='next'||m.cmd==='prev') && !F.started){ start(); return; }
    if(m.cmd==='next') F.next(); if(m.cmd==='prev') F.prev();
    if(m.cmd==='black') document.body.classList.toggle('black');
    if(m.cmd==='poll') pollKey(m.k);
    if(m.cmd==='chat') chatShow(m.text);
    if(m.cmd==='live') F.setLive(!F.live);
    if(m.cmd==='ping') broadcast();
  }
}
if(chan) chan.onmessage=e=>onMsg(e.data);
addEventListener('storage',e=>{ if(e.key==='uli-film-msg'&&!chan){ try{ onMsg(JSON.parse(e.newValue)); }catch(x){} } });
function presenterInit(){
  document.body.classList.add('presenter');
  document.title='Sprecheransicht · ULI';
  $('#bNext').onclick=()=>send({type:'cmd',cmd:'next'});
  $('#bPrev').onclick=()=>send({type:'cmd',cmd:'prev'});
  $('#bBlack').onclick=()=>send({type:'cmd',cmd:'black'});
  $('#bTimer').onclick=()=>{ pvT0=Date.now(); };
  $('#bLive').onclick=()=>send({type:'cmd',cmd:'live'});
  $$('#pvBtns [data-p]').forEach(b=>b.onclick=()=>send({type:'cmd',cmd:'poll',k:+b.dataset.p}));
  $('#pvChatIn').addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Enter'&&e.target.value.trim()){ send({type:'cmd',cmd:'chat',text:e.target.value.trim()}); e.target.value=''; }
  });
  addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT') return;
    if(e.repeat) return;
    if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(e.key)){ e.preventDefault(); send({type:'cmd',cmd:'next'}); }
    if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){ e.preventDefault(); send({type:'cmd',cmd:'prev'}); }
    if(e.key==='b'||e.key==='B') send({type:'cmd',cmd:'black'});
    const dg=/^Digit([0-4])$/.exec(e.code); if(dg) send({type:'cmd',cmd:'poll',k:+dg[1]});
  });
  setInterval(()=>{ if(!pvT0) return; const s=Math.floor((Date.now()-pvT0)/1000);
    const mm=v=>String(Math.floor(Math.abs(v)/60)).padStart(2,'0')+':'+String(Math.abs(v)%60).padStart(2,'0');
    const d=s-pvPlan;
    $('#pvTime').innerHTML=mm(s)+`<small class="${d>60?'late':d<-60?'early':''}">Plan ${mm(pvPlan)} · ${d>=0?'+':'−'}${mm(d)}</small>`; },500);
  send({type:'cmd',cmd:'ping'});
}

/* ─── BEDIENUNG ─────────────────────────────────────────────── */
function toast(t,ms=1400){ const e=$('#toast'); e.innerHTML=t; e.classList.add('on'); clearTimeout(e._t); e._t=setTimeout(()=>e.classList.remove('on'),ms); }
function start(){
  if(F.started) return; F.started=true;
  $('#gate').classList.add('gone'); show(0,true);
}
function setZoomMode(on){
  document.body.classList.toggle('zoommode',on); F.drift=!on;
  toast(on?'<b>Zoom-Modus an</b><br>Körnung und Kameradrift aus, schärfer im geteilten Bild':'Zoom-Modus aus',1800);
}
function keys(e){
  if(e.metaKey||e.ctrlKey) return;
  const k=e.key;
  const nav=['ArrowRight','ArrowDown','PageDown',' ','Enter','ArrowLeft','ArrowUp','PageUp'].includes(k);
  if(nav && e.repeat){ e.preventDefault(); return; }
  if(!F.started){ if(k!=='Shift'&&k!=='Alt'){ e.preventDefault(); start(); } return; }
  if(document.body.classList.contains('ov')){ if(k==='Escape'||k==='o'||k==='O') document.body.classList.remove('ov'); return; }
  if(k==='Escape' && document.body.classList.contains('panel-open')){ closePanel(); return; }
  if(document.body.classList.contains('panel-open') && F.sel && F.sel.kind==='field' && (k==='ArrowLeft'||k==='ArrowRight')){ e.preventDefault(); F.fieldStep&&F.fieldStep(k==='ArrowLeft'?-1:1); return; }
  if(document.body.classList.contains('panel-open') && F.sel && F.sel.kind==='prop' && (k==='ArrowLeft'||k==='ArrowRight') && e.shiftKey){ e.preventDefault(); carStep(k==='ArrowLeft'?-1:1); return; }
  const dg=/^Digit([0-4])$/.exec(e.code);
  if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(k)){ e.preventDefault(); F.next(); }
  else if(['ArrowLeft','ArrowUp','PageUp'].includes(k)){ e.preventDefault(); F.prev(); }
  else if(k==='Home') show(0); else if(k==='End') show(F.beats.length-1);
  else if(k==='b'||k==='B'||k==='.') document.body.classList.toggle('black');
  else if(k==='n'||k==='N') document.body.classList.toggle('notes');
  else if(k==='o'||k==='O') document.body.classList.toggle('ov');
  else if(k==='l'||k==='L') F.setLive(!F.live);
  else if(k==='t'||k==='T') F.setProbe(!document.body.classList.contains('probe'));
  else if(k==='z'||k==='Z') setZoomMode(!document.body.classList.contains('zoommode'));
  else if(k==='f'||k==='F'){ if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); else document.exitFullscreen(); }
  else if(k==='p'||k==='P'){ { const w=Math.min(460,Math.round(screen.availWidth*.3)), h=screen.availHeight;
      window.open(location.pathname+'#presenter','uli-presenter',`popup=yes,width=${w},height=${h},left=${screen.availWidth-w},top=0`); } toast('Sprecherfenster geöffnet<br><small>Es steuert dieses Fenster.</small>',1800); }
  else if(dg) pollKey(+dg[1], e.altKey);
}
function ovGrid(){
  $('#ovGrid').innerHTML=F.chapters.map(c=>`<div class="ovc" data-i="${c.n}" data-b="${c.start}">
    <b>${c.roman||'·'}</b><span>${I18N.tr(c.title)}</span><i>${I18N.ui('steps',c.beats.length)}</i></div>`).join('');
  $$('.ovc').forEach(e=>e.onclick=()=>{ document.body.classList.remove('ov'); show(+e.dataset.b); });
}
function overview(){
  ovGrid();
  const ticks=F.chapters.map(c=>`<div class="tk" style="left:${c.start/F.beats.length*100}%"></div>`).join('');
  $('#hudProg').insertAdjacentHTML('beforeend',ticks);
}
function preload(){
  const srcs=new Set(); F.beats.forEach(b=>{ if(b.photo&&b.photo.src) srcs.add(b.photo.src); });
  (F.extraAssets||[]).forEach(s=>srcs.add(s));
  const list=[...srcs]; let n=0;
  const done=()=>{ n++; $('#gate .load i').style.width=(n/Math.max(1,list.length)*100)+'%';
    if(n>=list.length) { const g=$('#gateGo'); g.dataset.i='ready'; g.textContent=I18N.ui('ready'); } };
  if(!list.length) done();
  F._pre=[];
  list.forEach(s=>{ const im=new Image(); im.src='./'+s; F._pre.push(im);
    (im.decode?im.decode():new Promise((r,j)=>{im.onload=r;im.onerror=j;})).then(done,done); });
}
let idleT; function wake(){ document.body.classList.remove('hide-cursor'); clearTimeout(idleT); idleT=setTimeout(()=>document.body.classList.add('hide-cursor'),2200); }
let focusAt=0;

F.boot = function(){
  build(); I18N.init();
  I18N.refresh=function(){
    F.pins.forEach(p=>{ if(p.el._src!=null) p.el.innerHTML=I18N.tr(p.el._src); });
    ovGrid();
    const sel=F.sel;
    if(F.idx>=0){ show(F.idx,true); if(F.started===false) return; }
    if(sel&&sel.kind==='field'&&F.openField) F.openField(sel.key);
    else if(sel&&sel.kind==='more') openMore(sel.key);
  };
  if(I18N.lang!=='es') F.pins.forEach(p=>{ if(p.el._src!=null) p.el.innerHTML=I18N.tr(p.el._src); });
  if(PRESENTER){ presenterInit(); return; }
  resolve(); overview(); preload(); wireExplore();
  addEventListener('keydown',keys);
  addEventListener('focus',()=>{ focusAt=performance.now(); });
  document.addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('.card.tap'); if(c){ c.classList.toggle('open'); }});
  $('#stage').addEventListener('click',e=>{
    if(performance.now()-focusAt<400) return;
    if(e.target.closest('#overview,#notes,.pe,.pin,#panel,input,button,label,.card.tap')) return;
    if(document.body.classList.contains('panel-open')){ closePanel(); return; }
    if(!F.started) return start();
    if(e.shiftKey) F.prev(); else F.next();
  });
  addEventListener('mousemove',wake); wake();
  addEventListener('resize',()=>{ if(F.idx>=0){ const b=F.beats[F.idx]; flyTo(b.R.cam,b.R.layout,true); measureOcc($('#text .comp:last-child')); } });
  if(/[?&]zoom/.test(location.search)) setZoomMode(true);
  if(/[?&]probe/.test(location.search)) document.body.classList.add('probe');
  F.cam=camToView({x:500,y:560,z:.9,ax:.5,ay:.5});
  requestAnimationFrame(camFrame);
  const hb=/^#b(\d+)/.exec(location.hash); if(hb){ F.started=true; $('#gate').classList.add('gone'); show(+hb[1],true); }
};
})();
