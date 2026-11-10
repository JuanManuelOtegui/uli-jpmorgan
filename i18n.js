/* English-only stub */
(function(){
  const UI={next:'next',prev:'back',full:'full screen',chapters:'chapters',black:'black screen',loading:'Loading …',ready:'Ready · press any key or click',ovh:'Chapters · click to jump',step:'step',steps:'steps',title:'Uruguay Land Invest · J.P. Morgan Natural Capital',gatep:'Presentation for J.P. Morgan Natural Capital'};
  const I=window.I18N={lang:'en',dict:{},collect:null,cache:{},refresh:null};
  I.ui=(k,n)=>{ if(k==='steps') return n+' '+(n>1?UI.steps:UI.step); return UI[k]||k; };
  I.tr=h=>h;
  I.applyStatic=()=>{ document.querySelectorAll('[data-i]').forEach(e=>{ e.textContent=UI[e.dataset.i]||e.textContent; }); document.title=UI.title; document.documentElement.lang='en'; };
  I.set=()=>{};
  I.init=()=>{ I.applyStatic(); };
})();
