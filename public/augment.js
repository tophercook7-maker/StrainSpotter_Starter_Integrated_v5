(function(){
  const norm = s => (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"").trim();

  function badge(){
    if(document.getElementById("ss-badge")) return;
    const b = document.createElement("div");
    b.id = "ss-badge";
    b.textContent = "SS✓";
    Object.assign(b.style,{
      position:"fixed",bottom:"12px",left:"12px",zIndex:99999,
      background:"rgba(0,0,0,.45)",color:"#fff",padding:"6px 8px",
      fontSize:"12px",borderRadius:"10px",border:"1px solid rgba(255,255,255,.2)"
    });
    document.body.appendChild(b);
  }

  function affiliatesBtn(){
    if(document.getElementById("ss-affil")) return;
    const a = document.createElement("a");
    a.id = "ss-affil";
    a.href = "/affiliates.html";
    a.textContent = "Affiliates";
    Object.assign(a.style,{
      position:"fixed",bottom:"12px",right:"12px",zIndex:99999,
      background:"rgba(0,0,0,.45)",color:"#fff",padding:"8px 12px",
      fontSize:"14px",borderRadius:"12px",border:"1px solid rgba(255,255,255,.2)",
      textDecoration:"none",backdropFilter:"blur(6px)"
    });
    document.body.appendChild(a);
  }

  async function loadMeta(){
    try{
      const res = await fetch("/data/strains.json",{cache:"no-store"});
      if(!res.ok) return null;
      const list = await res.json();
      const map = new Map();
      for(const it of list){
        map.set(norm(it.displayName), it);
        (it.aka||[]).forEach(a => map.set(norm(a), it));
      }
      // also expose a plain set of readable names for string search
      return {map, names: Array.from(new Set(list.flatMap(s=>[s.displayName, ...(s.aka||[])])))};
    }catch(e){ return null; }
  }

  function closestCard(node){
    if(!node) return null;
    return node.closest?.(
      ".result, .card, ion-card, li, .item, .tile, .panel, .container, .section, .page, .view"
    ) || node;
  }

  function enhance(el, meta){
    if(!el || el.dataset.ssEnhanced==="1") return;
    el.dataset.ssEnhanced = "1";
    const wrap = document.createElement("div");
    wrap.style.fontSize = "12px";
    wrap.style.opacity = "0.95";
    wrap.style.marginTop = "6px";
    wrap.style.lineHeight = "1.3";
    wrap.innerHTML = `
      <div>THC: <strong>${meta.thcPercent||"N/A"}</strong> · Climate: <strong>${meta.bestClimate||"N/A"}</strong></div>
      <div style="margin-top:4px;">
        ${(meta.seedSources||[]).slice(0,3).map(s=>`<a href="${s.url}" target="_blank" rel="noopener" style="color:#bdf;">${s.name}</a>`).join(" · ") || ""}
      </div>`;
    el.appendChild(wrap);
  }

  function indexTextNodes(root){
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        const t = n.nodeValue?.trim();
        return t && t.length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function findMatches(nodes, names){
    const results = [];
    const nameRegex = new RegExp("\\b(" + names.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|") + ")\\b","i");
    for(const tn of nodes){
      const m = tn.nodeValue.match(nameRegex);
      if(m){
        results.push({text:m[1], node:tn});
      }
    }
    return results;
  }

  async function run(){
    const meta = await loadMeta();
    if(!meta) return;
    badge();
    affiliatesBtn();

    const apply = () => {
      const nodes = indexTextNodes(document.body);
      const hits = findMatches(nodes, meta.names);
      for(const h of hits){
        const key = norm(h.text);
        const info = meta.map.get(key);
        if(!info) continue;
        const host = closestCard(h.node.parentElement);
        enhance(host, info);
      }
    };

    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.body, {childList:true, subtree:true});
    window.addEventListener("hashchange", apply);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
