(function(){
const F=window.FILM, D=window.ULI;
const DISC='For information only. Not an offer or investment advice. Figures are averages or illustrations with stated assumptions, not projections. Land is illiquid and capital is at risk.';
const fmt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const kin=(cls,t,d)=>`<div class="kin ${cls}"${d?` style="--d:${Math.round(d*.55)}ms"`:''}>${t}</div>`;
const rev=(t,d=0,cls='')=>`<div class="rev ${cls}" style="--d:${Math.round(d*.55)}ms">${t}</div>`;
const kick=(t,d=0)=>rev(`<div class="kick">${t}</div>`,d);
const src=(t,d=900)=>rev(`<div class="src">${t}</div>`,d);
const card=(t,v,d,extra='',more)=>`<div class="card ${extra}${more?' more':''}"${more?` data-more="${more}"`:''}><div class="ct">${t}</div><div class="cv">${v}</div><div class="cd">${d}</div></div>`;
const tcard=(t,v,d,extra='')=>card(t,v,d,extra+' tap');
const mlinks=(list,d=1600)=>rev(`<div class="mlinks">${list.map(x=>`<span class="mlink" data-more="${x[0]}">${x[1]}</span>`).join('')}</div>`,d);
const nl=items=>`<ul class="nl">${items.map((x,i)=>`<li><span class="n">0${i+1}</span><div><b>${x[0]}</b><span>${x[1]}</span></div></li>`).join('')}</ul>`;
const T=(head,rows,hl=[])=>`<table><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map((r,i)=>`<tr${hl.includes(i)?' class="hl"':''}>${r.map((c,j)=>`<td${j?' class="n"':''}>${c}</td>`).join('')}</tr>`).join('')}</table>`;
const yv=(usd,pct)=>`${usd}<div style="font-size:.62em;font-weight:500;line-height:1.3;margin-top:.8vmin;opacity:.9">${pct}</div>`;
const person=(img,name,role,tag,d)=>`<div class="person rev" style="--d:${d}ms"><div class="tag">${tag}</div><div class="ph2"><img src="./${img}" alt="${name}"></div><b>${name}</b><span>${role}</span></div>`;

F.more = {
  rol:{t:'Rule of law',h:`<p>In the World Justice Project Rule of Law Index 2025, Uruguay ranks <b>23rd of 143</b> countries worldwide and first in Latin America and the Caribbean.</p>
    <p>For a long-term asset like land, this matters most in three places: secure property rights, reliable courts and a predictable tax regime.</p>`,s:'WJP Rule of Law Index 2025.'},
  foreign:{t:'Foreign ownership, in detail',h:`<ul>
    <li><b>Individuals</b> of any nationality may own rural land directly, on the same terms as Uruguayans.</li>
    <li><b>Companies</b> may hold rural land only with registered shares owned by identifiable individuals (Law 18,092, 2007). Exceptions require authorization from the Executive Branch, which is how funds are structured.</li>
    <li><b>Foreign states</b> and state-controlled entities may not acquire rural land (Law 19,283, 2014).</li>
    <li>A <b>bill to restrict foreign purchases</b> has been in the Senate since July 2026. As of September 2026 there is no consensus, and it would not be retroactive.</li>
    <li>Transfer is by public deed, registered in the Property Registry.</li></ul>`,s:'Summary as of September 2026, not legal advice. Uruguayan counsel confirms each transaction.'},
  landprice:{t:'Land prices since 2000',h:T(['Year','US$ per ha'],[['2000','448'],['2002, low after the crisis','385'],['2014, boom peak','3,934'],['2016','3,380'],['2021','3,499'],['2024','3,967'],['2025, record','4,178']],[6])+
    `<p>The 2003 to 2014 rise was a one-time re-rating: Chinese soybean demand, international agricultural capital, no-till farming. It should not be extrapolated.</p>
    <p>Annualized: +17.2% (2000–2014), −0.9% (2014–2021), +4.9% (2021–2025).</p>
    <p>2025: 1,718 rural sales and 258,942 ha, about 31% fewer hectares than in 2024. A narrow market: large blocks have a handful of buyers per year.</p>`,s:'MGAP-DIEA, land price series. Averages, not appraisals of a specific property.'},
  macro:{t:'2026: a slower year',h:`<ul>
    <li>GDP grew <b>1.8% in 2025</b> (3.3% in 2024).</li>
    <li>In 2026 the first half grew about 0.3% year on year; the second quarter fell 0.5% year on year, driven by the drought's hit to soybeans.</li>
    <li>2026 forecasts: about 1.0% (BCU analyst survey), 1.6% (Ministry of Economy), about 1% (Fitch). Fitch projects 1.8% a year for 2027–2028.</li>
    <li>Inflation was 4.87% year on year in October 2026, inside the 3–6% target range.</li></ul>
    <p>We show this because the cycle matters for how you read the macro picture. Land values have historically followed the long run, not the single year.</p>`,s:'BCU, INE, Fitch, Ministry of Economy and Finance (MEF). Figures as of November 2026.'},
  forest:{t:'Forestry sector, in numbers',h:T(['Indicator','Figure'],[['Planted forest area, 2025','1,198,207 ha (6.85% of national territory)'],['Eucalyptus / pine','972,871 ha / 125,158 ha'],['Wood extraction','23.5 M m³ (+3.3%)'],['Forestry exports','US$2,754 M (20.4% of goods exports)'],['UPM Paso de los Toros mill','US$3,470 M investment']]),s:'MGAP-DGF, Superficie Plantada Informe 2026; Uruguay XXI.'},
};
const LANDPRICE = {"2000": 448, "2001": 413, "2002": 385, "2003": 420, "2004": 664, "2005": 725, "2006": 1132, "2007": 1432, "2008": 1844, "2009": 2329, "2010": 2633, "2011": 3196, "2012": 3478, "2013": 3519, "2014": 3934, "2015": 3584, "2016": 3380, "2017": 3712, "2018": 3257, "2019": 3342, "2020": 3295, "2021": 3499, "2022": 3741, "2023": 3783, "2024": 3967, "2025": 4178};
const LPCHART = ()=>{
  const W=1000,H=330,ys=Object.keys(LANDPRICE).map(Number),x=y=>(y-2000)/25*W,y=v=>H-v/4500*H;
  const pts=ys.map(k=>x(k).toFixed(1)+','+y(LANDPRICE[k]).toFixed(1)).join(' ');
  const grid=[1000,2000,3000,4000].map(v=>`<line class="gl" x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="-12" y="${y(v)+4}" text-anchor="end">${fmt(v)}</text>`).join('');
  const yrs=[2000,2005,2010,2015,2020,2025].map(k=>`<text x="${x(k)}" y="${H+26}" text-anchor="middle">${k}</text>`).join('');
  return `<div class="lp rev" style="--d:500ms"><svg viewBox="-60 -20 ${W+120} ${H+50}">
    <defs><linearGradient id="lpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8B86D" stop-opacity=".35"/><stop offset="1" stop-color="#E8B86D" stop-opacity="0"/></linearGradient></defs>
    <rect class="band" x="${x(2014)}" y="0" width="${x(2021)-x(2014)}" height="${H}"/><text class="band-t" x="${(x(2014)+x(2021))/2}" y="16" text-anchor="middle">flat 2014 to 2021</text>
    <g class="ax">${grid}${yrs}</g>
    <polygon class="ar" points="0,${H} ${pts} ${W},${H}"/>
    <polyline class="ln" pathLength="1" points="${pts}"/>
    <circle class="pt" cx="${x(2000)}" cy="${y(448)}" r="6"/><text class="pt-t" x="${x(2000)+12}" y="${y(448)-12}">US$448</text>
    <circle class="pt" cx="${x(2025)}" cy="${y(4178)}" r="7"/><text class="pt-t g" x="${x(2025)-12}" y="${y(4178)-16}" text-anchor="end">US$4,178 · 2025</text>
  </svg></div>`; };

const C={far:{x:500,y:545,km:700},country:{x:500,y:545,km:560,ax:.74,ay:.5},countryC:{x:500,y:545,km:600,ax:.5,ay:.5},countryL:{x:500,y:545,km:560,ax:.7,ay:.5}};
const FOREST_HA={'rivera':141739,'tacuarembo':139828,'rio-negro':134878,'paysandu':128700,'durazno':99414,'lavalleja':96657,'cerro-largo':93638,'florida':56587,'rocha':53296,'treinta-y-tres':50874,'soriano':47084,'maldonado':34618,'canelones':26684,'flores':24610,'colonia':12649,'san-jose':8037,'salto':5758,'artigas':5585,'montevideo':1217};
const FOREST_H=Object.fromEntries(Object.entries(FOREST_HA).map(([k,v])=>[k,+(v/141739).toFixed(3)]));
const FOREST_L=['rivera','tacuarembo','rio-negro','paysandu','durazno','lavalleja','cerro-largo'];
const LIVE_D=['artigas','rivera','tacuarembo','cerro-largo','treinta-y-tres'];
const zone=(hi,extra)=>Object.assign({glow:true,hi,dimOthers:true,depts:hi},extra||{});
const PH=(s)=>({src:s,op:.55,keep:true,from:[1.03,0,0],to:[1.03,0,0],mask:'linear-gradient(90deg,#000 0%,#000 30%,transparent 50%)'});

/* ---------- Arrival ---------- */
F.chapter({title:'Arrival',beats:[
 {label:'Cover',hud:false,cam:C.country,map:{glow:true,sweep:true},veil:null,layout:'center',
  html:`<div class="col"><img class="logo-hero rev" src="./logo.png" alt="Uruguay Land Invest">
      ${kin('h-xl shadow','Own the land that<br><em>feeds, builds and grows.</em>',300)}
      ${rev('<div class="lede">Uruguay: forestry land, with a livestock layer on the rest</div>',1300)}
      ${rev('<div class="src" style="margin-top:1.6vmin">Prepared for J.P. Morgan Natural Capital · November 2026</div>',1600)}</div>`}
]});

/* ---------- I Uruguay ---------- */
F.chapter({roman:'I',title:'Uruguay',beats:[
 {label:'Stability',cam:C.countryL,map:{glow:true,hi:'all',sweep:true,depts:true},veil:'left',layout:'left',
  html:`<div class="col">${kick('Why Uruguay · safety first')}
   ${kin('h-l','Stable enough to hold land <em>for decades.</em>')}
   <div class="cards" style="grid-template-columns:1fr">
    ${rev(card('Sovereign rating','Investment grade','Fitch BBB, stable outlook (September 2026). S&amp;P BBB+, Moody\'s Baa1.'),600)}
    ${rev(card('Rule of law','No. 1','in Latin America. WJP Index 2025, 23rd of 143.','','rol'),800)}
    ${rev(card('Foreign ownership','Open','Individuals buy full title on equal terms. Companies need registered shares.','','foreign'),1000)}
   </div>${src('Fitch, S&amp;P, Moody\'s; WJP 2025; Law 18,092. Legal summary as of September 2026, not legal advice. A bill to restrict foreign purchases is under debate in the Senate.',1400)}</div>`},
 {label:'Macro',cam:C.country,map:{glow:true,hi:'all',op:.3},veil:'full',layout:'center',
  html:`<div class="col wide">${kick('Why Uruguay · the macro picture')}
   ${kin('h-l','A small economy, <em>built for stability.</em>')}
   <div class="cards c3">
    ${rev(card('GDP','US$85.6 B','US$24,549 per capita, high income (World Bank), 2025.'),600)}
    ${rev(card('Inflation','4.87%','October 2026, year on year, inside the 3–6% central bank target (2025: 3.65%).','accent'),800)}
    ${rev(card('Growth','1.8% in 2025','2026 is slower: about 1% expected after a drought year hit soybeans.','warn','macro'),1000)}
   </div>${src('World Bank, IMF 2025 (GDP); INE (inflation); BCU, Fitch (growth). Figures as of November 2026.',1400)}</div>`},
 {label:'Land value',cam:C.country,map:{glow:true,op:.25},veil:'full',layout:'center',foot:DISC,
  html:`<div class="col wide" style="max-width:min(86vw,1400px)">${kick('Land value · 25 years')}
   ${kin('h-l','From US$448 to <em>US$4,178 per hectare.</em>')}
   ${LPCHART()}
   ${rev('<div class="lede" style="margin-top:1.6vmin">About 6.7% a year after US inflation since 2000, a record in 2025 (+5.3%). Not a straight line: flat from 2014 to 2021.</div>',2400)}
   ${src('MGAP-DIEA, land sales, all transactions of 10 ha and more; real growth deflated by US CPI-U (9.3% a year nominal). Past performance is not a forecast.',2800)}
   ${mlinks([['landprice','The series in detail']],3000)}</div>`,
  after:root=>{const l=root.querySelector('.lp');requestAnimationFrame(()=>requestAnimationFrame(()=>l&&l.classList.add('in')))}},
 {label:'Climate',cam:C.country,photo:null,map:{glow:true,hi:'all'},veil:'full',layout:'center',
  html:`<div class="col wide">${kick('Climate')}
   ${kin('h-l','Temperate and humid, <em>with a lesson from 2023.</em>')}
   <div class="cards c3">
    ${rev(card('Rainfall','1,100–1,400 mm','a year, spread across all seasons.'),600)}
    ${rev(card('Temperature','18.4 °C','on average. No dry season, no frost belt.'),800)}
    ${rev(card('2022–23','Drought','The worst in over 70 years. We learned from it.','warn'),1000)}
   </div>${rev('<div class="lede">That is why we select by the water on the property, not by region.</div>',1400)}
   ${src('INUMET climate normals; IPCC AR6 for southeastern South America.',1700)}</div>`,
  after:(root,F)=>{const m=document.getElementById('map');F.later(()=>m.classList.add('drought'),1000);F.later(()=>m.classList.remove('drought'),4600)}}
]});

/* ---------- II Forestry ---------- */
F.chapter({roman:'II',title:'Forestry',beats:[
 {label:'Forestry · the sector',photo:PH('forest-aerial.jpg'),cam:C.countryL,map:{glow:true,depts:FOREST_L,heat:FOREST_H},veil:'left',layout:'left',foot:DISC,
  html:`<div class="col" style="max-width:min(47vw,860px)">${kick('Forestry · the north and the Río Negro basin')}
   ${kin('h-l','Long cycles. <em>Industrial demand.</em>')}
   ${rev('<div class="lede">Eucalyptus for pulp, with industrial demand from UPM and Montes del Plata.</div>'+nl([
    ['Planted area','1.2 million ha, 6.85% of the territory, 81% eucalyptus.'],
    ['Priority forestry soils','The best soils for trees. Tax benefits for 12 years.'],
    ['Cycle','About 11 years.'],
    ['Growth','MAI of 27 to 33 m³ per hectare per year.']]),600)}
   <div class="cards c3" style="max-width:none">
    ${rev(card('Forestry exports','US$2.75 B','20.4% of goods exports, 2025.','numsm','forest'),1100)}
    ${rev(card('Wood extraction','23.5 M m³','+3.3% in 2025.','numsm'),1250)}
    ${rev(card('Forestry land','US$3,000–3,800','per ha in forestry zones.','numsm'),1400)}
   </div>
   ${src('MGAP-DGF, Superficie Plantada Informe 2026; Uruguay XXI. Land range: ULI estimate from MGAP-DIEA.',1800)}</div>`},
 {label:'Forestry · own production',photo:PH('forest-aerial.jpg'),cam:C.countryL,map:{glow:true,depts:FOREST_L,heat:FOREST_H},veil:'left',layout:'left',foot:DISC,
  html:`<div class="col" style="max-width:min(47vw,860px)">${kick('Forestry · plant and wait')}
   ${kin('h-l','Own the trees, <em>not just the land.</em>')}
   ${rev('<div class="lede">Plant, manage for 11 years and harvest. The return comes from the wood, with the land held at constant value.</div>',600)}
   <div class="cards c2" style="max-width:none">
    ${rev(tcard('Own production · annual result',yv('US$340–566 per ha/year','6.3–12.9% gross yield, median 9.2%'),'Revenue less forestry costs (US$1,400–1,600 per ha), spread over 11 years. MAI 27–33 m³/ha/year, wood at US$18–21/m³.','numsm accent'),1000)}
    ${rev(tcard('For reference · leasing',yv('US$169 per ha/year','4.4–5.6% gross yield'),'Market rent from pulp companies on 24–35 year contracts. A market reference, not our proposal here.','numsm'),1200)}
   </div>
   ${src('ULI model, simple average, not an IRR: yield = (revenue less forestry costs) ÷ 11 years ÷ (land + forestry costs), land at constant value. Excludes tending, insurance, administration, freight, harvest and taxes; very sensitive to MAI and wood price. Rents: MGAP-DIEA 2025. Illustrative, not a projection.',1700)}</div>`},
 {label:'Forestry · the rest of the land',cam:C.country,map:{glow:true,op:.3},veil:'full',layout:'center',foot:DISC,
  html:`<div class="col wide" style="max-width:min(88vw,1300px)">${kick('Forestry · using the whole property')}
   ${kin('h-l','The land you cannot plant <em>still earns every year.</em>')}
   ${rev('<div class="lede">Part of every forestry property cannot be planted: slopes, wetlands, rocky ground. Leased for cattle, it pays a market rent while the trees grow.</div>',600)}
   <div class="jp-sl rev" style="--d:900ms">
     <div class="jp-sl-top"><span>Plantable share of the property</span><b id="jpP">60%</b></div>
     <input id="jpR" type="range" min="40" max="90" step="5" value="60" aria-label="Plantable share of the property">
   </div>
   <div class="cards c3" style="max-width:none">
    ${rev(card('Whole property, average','<span id="jpTot">US$238–374</span>','per ha/year across the property, forestry plus livestock rent.','accent'),1100)}
    ${rev(card('Forestry layer','<span id="jpFor">US$204–340</span>','per ha/year, on the plantable share (US$340–566 on planted land).'),1250)}
    ${rev(card('Livestock layer','<span id="jpLiv">US$34</span>','per ha/year, from leasing the non-plantable share at US$85. It arrives every year while the forest grows.'),1400)}
   </div>
   ${src('Livestock rent: MGAP-DIEA 2025, US$85 per ha/year, 1,261 contracts. Plantable share is a user-set illustration, not a property survey. Forestry pays at thinning and harvest, so the annual figure is an average. Excludes land appreciation. Not a projection.',1800)}</div>`,
  after:root=>{
    const r=root.querySelector('#jpR'); if(!r) return;
    ['keydown','keyup','pointerdown','click'].forEach(ev=>r.addEventListener(ev,e=>{ if(ev!=='keydown'||/Arrow|Home|End/.test(e.key)) e.stopPropagation(); }));
    const LO=340,HI=566,L=85,$=s=>root.querySelector(s);
    const calc=()=>{ const p=r.value/100, add=L*(1-p);
      $('#jpP').textContent=r.value+'%';
      $('#jpTot').textContent='US$'+fmt(LO*p+add)+'–'+fmt(HI*p+add);
      $('#jpFor').textContent='US$'+fmt(LO*p)+'–'+fmt(HI*p);
      $('#jpLiv').textContent='US$'+fmt(add); };
    r.addEventListener('input',calc); calc(); }},
]});

/* ---------- III Livestock ---------- */
F.chapter({roman:'III',title:'Livestock',beats:[
 {label:'Livestock · the largest land use',photo:PH('herd-hereford.jpg'),cam:C.countryL,map:zone(LIVE_D),veil:'left',layout:'left',foot:DISC,
  html:`<div class="col" style="max-width:min(46vw,820px)">${kick('Livestock · the north and the east')}
   ${kin('h-l',"Uruguay's largest <em>land use.</em>")}
   ${rev('<div class="lede">Cow-calf, growing or finishing on natural grassland all year. A steady tenant market for land that trees cannot use.</div>'+nl([
    ['Traceability','11.7 million cattle with individual traceability by law (Law 17,997, SNIG).'],
    ['Exports','Beef is the No. 1 export: US$2.68 B in 2025, 20% of the total.']]),700)}
   <div class="cards c2">
    ${rev(card('Livestock land','US$2,800–3,800','per ha in livestock zones','numsm'),950)}
    ${rev(card('Lease rent',yv('US$85 per ha/year','2.2–3.0% gross yield'),'MGAP-DIEA 2025','accent numsm'),1150)}
   </div>
   ${src('Uruguay XXI 2025; SNIG; USDA-FAS 2026; MGAP-DIEA leases 2025. Land range: ULI estimate. Indicative zones.',1600)}</div>`}
]});

/* ---------- IV ULI ---------- */
F.chapter({roman:'IV',title:'Uruguay Land Invest',beats:[
 {label:'Who we are',photo:{src:'family-field.jpg',pos:'center 68%',from:[1.14,-7,0],to:[1.1,-5,0],dur:28},veil:'right',layout:'right',mini:false,foot:DISC,
  html:`<div class="col" style="max-width:min(36vw,580px)">${kick('Who we are')}
   ${kin('h-l','A local family, <em>in the field since day one.</em>')}
   ${rev('<div class="lede">An agricultural services company built on our own track record on the ground: technical depth in livestock, farming, forestry and irrigation, present from planning through execution and reporting. <em>Our experience, at the service of your investment.</em></div>',650)}
   <div class="track">
    ${rev('<div><b>25+</b><span>years producing in Uruguay, our partners</span></div>',1000)}
    ${rev('<div><b>10,000+</b><span>hectares owned and managed in Tacuarembó</span></div>',1150)}
   </div>
   ${src('Track record of our partners in Uruguay (Oteguí family).',1400)}</div>`},
 {label:'The team',cam:C.far,photo:null,map:{glow:true},veil:'deep',layout:'center',foot:DISC,
  html:`<div class="col wide">${kick('Uruguay Land Invest · the team in Uruguay')}
   ${rev('<div class="lede" style="margin-top:0;margin-bottom:1vmin">We find, structure and manage direct land investments in Uruguay.</div>',150)}
   <div class="people six">
    ${person('p-juan.png','Juan Manuel Oteguí','Operations and execution','Uruguay',300)}
    ${person('p-pablo-v.png','Pablo Oteguí Vilaro','Partner · 25+ years in production','Uruguay',400)}
    ${person('p-pablo-j.png','Pablo José Oteguí','Financial analysis and structuring','Uruguay',500)}
    ${person('p-tomas.png','Tomás Fonseca','Financial modeling','Uruguay',600)}
   </div></div>`},
 {label:'What we do',photo:{src:'gauchos-herd.jpg',from:[1.34,-14,0],to:[1.28,-10,0],dur:30},veil:'right',layout:'right',foot:DISC,
  html:`<div class="col" style="max-width:min(42vw,690px)">${kick('Who executes')}
   ${kin('h-l','We don\'t sell land. <em>We structure and run it.</em>')}</div>
   <div class="tlh" style="position:absolute;left:7vw;right:7vw;bottom:11vh">
    ${['Search and selection|Technical and market review of every property','Structuring the investment|Direct, through a company, alone or with others','Legal and title|Coordinated with Uruguayan lawyers and notaries','Property management|We operate the asset for you','Buyers and marketing|Contact with mills, traders and meat packers','Reporting and exit|Regular reports, exit planned from day one']
     .map((x,i)=>{ const [b,t]=x.split('|'); return rev(`<div class="p"><div class="n">0${i+1}</div><div class="card accent"><b>${b}</b><span>${t}</span></div></div>`,500+i*130); }).join('')}
   </div>`}
]});

/* ---------- Close ---------- */
F.chapter({title:'Next step',beats:[
 {label:'Next step',cam:C.country,photo:null,map:{glow:true,sweep:true},veil:'deep',layout:'center',foot:DISC,
  html:`<div class="col"><img class="logo-hero rev" src="./logo.png" alt="Uruguay Land Invest">
   ${kin('h-l','Where could this fit <em>with you?</em>',300)}
   ${rev(nl([
    ['Your criteria','Tell us what a Uruguay forestry mandate would need to look like for J.P. Morgan Natural Capital.'],
    ['Your view on the numbers','We would value your read on our assumptions, then share the model behind them.'],
    ['The land','A visit to forestry country in Rivera and Tacuarembó, when it suits your team.']]),900)}
   ${rev('<div class="src" style="margin-top:2vmin">Thank you · Uruguay Land Invest</div>',1500)}</div>`}
]});
})();
