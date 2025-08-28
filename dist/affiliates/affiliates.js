(async function(){
  async function getDB(){
    try{ const r = await fetch("/affiliates/strains.json",{cache:"no-store"}); return r.ok ? r.json() : {} }catch(e){ return {} }
  }
  function guessName(card){
    const el = card.querySelector(".result-title, .title, h3, h2, [data-name]");
    if(el) return el.textContent.trim();
    const img = card.querySelector("img[alt]"); if(img) return (img.getAttribute("alt")||"").trim();
    const t = (card.textContent||"").trim().split("\n").map(s=>s.trim()).filter(Boolean)[0]||"";
    return t.slice(0,80);
  }
  function box(name, info){
    const div = document.createElement("div");
    div.className = "strain-info";
    div.innerHTML = `
      <p><b>${name}</b></p>
      <p><b>Type:</b> ${info.type||"—"} (S:${info.sativa??"—"}% I:${info.indica??"—"}%)</p>
      <p><b>THC:</b> ${info.thc||"—"}</p>
      ${info.grow?`<p><b>Grow:</b> ${info.grow}</p>`:""}
      ${info.seeds?`<p><a href="${info.seeds}" target="_blank" rel="noopener">Buy Seeds</a></p>`:""}
      ${info.flower?`<p><a href="${info.flower}" target="_blank" rel="noopener">Buy Flower</a></p>`:""}
    `;
    return div;
  }
  const DB = await getDB();
  function enhance(){
    document.querySelectorAll(".result, .card, ion-card").forEach(card=>{
      if(card.dataset.enhanced) return;
      const name = guessName(card);
      const info = DB[name];
      if(info){ card.appendChild(box(name, info)); card.dataset.enhanced="1"; }
    });
  }
  document.addEventListener("DOMContentLoaded", enhance);
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true, childList:true});
})();
