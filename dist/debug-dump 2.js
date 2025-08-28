(function(){
  const CANDIDATES=[".result",".results .result",".card",".Card","ion-card","[data-card]",".item"];
  const style=document.createElement("style");
  style.textContent=`${CANDIDATES.join(",")}{outline:2px dashed rgba(255,255,255,.5);outline-offset:2px;}`;
  document.documentElement.appendChild(style);
  function overlay(txt){
    const wrap=document.createElement("div");
    wrap.style.cssText="position:fixed;right:8px;bottom:8px;max-width:88%;background:rgba(0,0,0,.85);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:10px 12px;z-index:999999;font:12px/1.35 -apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial;box-shadow:0 8px 30px rgba(0,0,0,.5)";
    const h=document.createElement("div");
    h.style.cssText="display:flex;align-items:center;gap:8px;margin-bottom:6px;";
    h.innerHTML='<strong>Debug: First result card HTML</strong><button id="dbg-close" style="margin-left:auto;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:8px;color:#fff;padding:4px 8px">Close</button>';
    const pre=document.createElement("pre");
    pre.style.cssText="white-space:pre-wrap;max-height:40vh;overflow:auto;margin:0;padding:8px;background:rgba(255,255,255,.08);border-radius:8px;border:1px solid rgba(255,255,255,.12)";
    pre.textContent=(txt||"").trim();
    wrap.appendChild(h);wrap.appendChild(pre);document.body.appendChild(wrap);
    wrap.querySelector("#dbg-close").onclick=()=>wrap.remove();
  }
  function firstCard(){
    for(const sel of CANDIDATES){ const el=document.querySelector(sel); if(el) return el; }
    return null;
  }
  function dump(){
    const el=firstCard();
    if(!el){ overlay("No candidate card found. Add a .result or ion-card wrapper if possible."); return; }
    overlay(el.outerHTML);
    console.log("[debug-dump] First card matched:", el);
  }
  if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded",()=>setTimeout(dump,500)); }
  else { setTimeout(dump,500); }
})();
