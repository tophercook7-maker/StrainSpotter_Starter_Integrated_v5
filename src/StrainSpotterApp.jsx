import React, { useEffect, useState } from "react";
import { imageToEmbedding, cosine } from "./ai";

/* ====== Theming ====== */
const theme = {
  bg: "linear-gradient(180deg, #052e16 0%, #064e3b 42%, #0b3f2a 100%)",
  cardBg: "#0b2f25",
  cardBorder: "rgba(20, 83, 45, .6)",
  text: "#e2f7e9",
  subtext: "#93e2b9",
  line: "rgba(16, 185, 129, .25)",
  primary: "#10b981",
  primaryStrong: "#059669",
  tabIdle: "#0b2f25",
  tabIdleBorder: "rgba(16,185,129,.25)",
  chip: "#083e2e",
  halo: "0 0 0 4px rgba(16,185,129,.15)",
};

/* ---------- Helpers (unchanged) ---------- */
const LS_KEY = "strainspotter_gallery_v1";
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}
function toDownscaledCanvas(img, maxSide = 1024) {
  const w0 = img.naturalWidth || img.width || 1;
  const h0 = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}
function canvasToPreviewURL(canvas, quality = 0.9) {
  try { return canvas.toDataURL("image/jpeg", quality); }
  catch { return canvas.toDataURL(); }
}

/* ---------- UI bits ---------- */
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? theme.primary : theme.tabIdleBorder}`,
        background: active ? theme.primary : theme.tabIdle,
        color: active ? "#052e16" : theme.text,
        fontWeight: 800,
        letterSpacing: .2,
        cursor: "pointer",
        boxShadow: active ? theme.halo : "none",
        transition: "all .18s ease",
      }}
    >
      {children}
    </button>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 18,
      padding: 16,
      background: theme.cardBg,
      boxShadow: "0 8px 24px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.03)"
    }}>
      {title && (
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: 6 }}>
          <span style={{ filter:"drop-shadow(0 0 8px rgba(16,185,129,.35))" }}>🌿</span>
          <div style={{ fontSize: 18, fontWeight: 900, color: theme.text }}>{title}</div>
        </div>
      )}
      {subtitle && <div style={{ fontSize: 13, color: theme.subtext, marginBottom: 12 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

function LeafBadge() {
  return (
    <div style={{
      position:"absolute", top:8, right:8,
      background: theme.chip, color: theme.subtext,
      border: `1px solid ${theme.line}`, borderRadius: 999,
      padding: "4px 8px", fontSize: 11, fontWeight: 800,
      letterSpacing: .3
    }}>🌿</div>
  );
}

/* ---------- Main App ---------- */
export default function StrainSpotterApp() {
  const [ageOk, setAgeOk] = useState(false);
  const [tab, setTab] = useState("classify");

  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(items)); }, [items]);

  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [queryPreview, setQueryPreview] = useState(null);

  async function onAddToGallery(e) {
    if (busy) { alert("Please wait…"); return; }
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      const label = window.prompt("Enter a label:", f.name.replace(/\.[^.]+$/, "")) ?? "";
      if (label === "") { e.target.value = ""; return; }
      setBusy(true);

      const { img, url } = await fileToImage(f);
      const canvas = toDownscaledCanvas(img, 1024);
      const emb = await imageToEmbedding(canvas);
      const preview = canvasToPreviewURL(canvas, 0.85);

      setItems(x => [...x, { id: "item_"+Date.now(), name: label.trim(), emb, img: preview }]);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Add failed: " + (err?.message || err));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function onClassify(e) {
    if (busy) { alert("Please wait…"); return; }
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (items.length === 0) { alert("Add gallery photos first."); e.target.value = ""; return; }
      setBusy(true); setResults([]); setQueryPreview(null);

      const { img, url } = await fileToImage(f);
      const canvas = toDownscaledCanvas(img, 1024);
      setQueryPreview(canvasToPreviewURL(canvas, 0.85));
      const emb = await imageToEmbedding(canvas);

      const scored = items
        .map(it => ({ ...it, score: cosine(emb, it.emb || []) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setResults(scored);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Classify failed: " + (err?.message || err));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  function renameItem(id) {
    const it = items.find(i => i.id === id); if (!it) return;
    const name = window.prompt("New name:", it.name);
    if (name == null) return;
    setItems(xs => xs.map(x => x.id === id ? { ...x, name: name.trim() || "Untitled" } : x));
  }
  function deleteItem(id) {
    if (!confirm("Remove this photo from your gallery?")) return;
    setItems(xs => xs.filter(x => x.id !== id));
  }

  if (!ageOk) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, padding: 24, display: "grid", placeItems: "center" }}>
        <Card title="StrainSpotter" subtitle="Age confirmation required">
          <div style={{ marginBottom: 12, color: theme.text }}>Are you 21 or older?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setAgeOk(true)} style={{
              padding:"10px 14px", border:`1px solid ${theme.primaryStrong}`, background: theme.primary,
              color:"#052e16", borderRadius:12, fontWeight:900, boxShadow: theme.halo
            }}>Yes</button>
            <button onClick={() => alert("Sorry, you must be 21+")} style={{
              padding:"10px 14px", border:`1px solid ${theme.tabIdleBorder}`, background: theme.tabIdle,
              color: theme.text, borderRadius:12
            }}>No</button>
          </div>
        </Card>
      </div>
    );
  }

  const galleryCount = items.length;

  return (
    <div style={{ minHeight:"100vh", background: theme.bg, color: theme.text, padding: 16 }}>
      {/* Header */}
      <div style={{ maxWidth: 980, margin: "12px auto 16px auto", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{
          width:38, height:38, borderRadius:999,
          background: "radial-gradient(circle at 30% 30%, #16a34a 0%, #065f46 60%)",
          display:"grid", placeItems:"center", boxShadow: theme.halo, border:`1px solid ${theme.line}`
        }}>🌿</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: .3 }}>StrainSpotter</div>
          <div style={{ fontSize: 12, color: theme.subtext }}>Leafy-fresh visual matching</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 980, margin: "0 auto", display:"flex", gap: 10, alignItems:"center", flexWrap:"wrap" }}>
        <TabButton active={tab === "classify"} onClick={() => setTab("classify")}>Classify Photo</TabButton>
        <TabButton active={tab === "gallery"} onClick={() => setTab("gallery")}>My Gallery ({galleryCount})</TabButton>
        <TabButton active={tab === "import"} onClick={() => setTab("import")}>Import / Export</TabButton>
        {busy && <div style={{ fontSize: 12, color: theme.subtext }}>Processing…</div>}
      </div>

      <div style={{ maxWidth: 980, margin: "14px auto 40px auto", display:"grid", gap: 16 }}>
        {/* CLASSIFY */}
        {tab === "classify" && (
          <Card title="Classify Photo" subtitle="Pick a photo to find the closest matches in your gallery.">
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
              <label style={{
                padding:"10px 14px", border:`1px solid ${theme.line}`, background: theme.chip,
                color: theme.text, borderRadius:12, cursor:"pointer", fontWeight:700
              }}>
                Choose Photo…
                <input type="file" accept="image/*" onChange={onClassify} style={{ display:"none" }} />
              </label>
            </div>

            {queryPreview && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 6, color: theme.subtext }}>Your photo</div>
                <div style={{ width: 240, border: `1px solid ${theme.line}`, borderRadius: 14, overflow: "hidden", background: "#052e16" }}>
                  <div style={{ position:"relative" }}>
                    <img src={queryPreview} alt="Query" style={{ width:"100%", height:"auto", display:"block" }} />
                    <LeafBadge />
                  </div>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900, marginBottom: 6, color: theme.subtext }}>Top matches</div>
                <div style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))" }}>
                  {results.map((r, i) => (
                    <div key={r.id || i} style={{
                      border:`1px solid ${theme.line}`, borderRadius:14, padding:8, background: "#062a21"
                    }}>
                      <div style={{
                        width:"100%", paddingTop:"62%", position:"relative",
                        background:"#0f5136", borderRadius:10, overflow:"hidden"
                      }}>
                        <img src={r.img} alt={r.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                        <LeafBadge />
                      </div>
                      <div style={{ marginTop: 6, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                        <div style={{ fontWeight: 800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</div>
                        <div style={{ fontSize:12, color: theme.subtext }}>{r.score.toFixed(3)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* GALLERY */}
        {tab === "gallery" && (
          <Card title="My Gallery" subtitle="Add labeled photos; your classifier uses these as references.">
            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:12 }}>
              <label style={{
                padding:"10px 14px", border:`1px solid ${theme.line}`, background: theme.chip,
                color: theme.text, borderRadius:12, cursor:"pointer", fontWeight:700
              }}>
                Add Photo…
                <input type="file" accept="image/*" onChange={onAddToGallery} style={{ display:"none" }} />
              </label>
              <div style={{ fontSize:12, color: theme.subtext }}>{galleryCount} item{galleryCount===1?"":"s"}</div>
            </div>

            {items.length === 0 ? (
              <div style={{ fontSize:14, color: theme.subtext }}>No items yet. Add a photo to get started.</div>
            ) : (
              <div style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))" }}>
                {items.map(it => (
                  <div key={it.id} style={{ border:`1px solid ${theme.line}`, borderRadius:14, padding:8, background:"#062a21" }}>
                    <div style={{ width:"100%", paddingTop:"62%", position:"relative", background:"#0f5136", borderRadius:10, overflow:"hidden" }}>
                      <img src={it.img} alt={it.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      <LeafBadge />
                    </div>
                    <div style={{ marginTop:6, display:"flex", gap:8, alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ fontWeight:800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.name}</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => renameItem(it.id)} title="Rename" style={{
                          border:`1px solid ${theme.line}`, background: theme.chip, color: theme.text,
                          borderRadius:8, padding:"4px 8px", fontWeight:700
                        }}>Rename</button>
                        <button onClick={() => deleteItem(it.id)} title="Delete" style={{
                          border:`1px solid rgba(239,68,68,.4)`, color:"#fecaca",
                          background:"#3b0a0a", borderRadius:8, padding:"4px 8px", fontWeight:700
                        }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* IMPORT / EXPORT */}
        {tab === "import" && (
          <Card title="Import / Export" subtitle="Backup your gallery JSON or import it on another device.">
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <button
                onClick={() => {
                  const data = JSON.stringify(items);
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "strainspotter_gallery.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding:"10px 14px", border:`1px solid ${theme.line}`, background: theme.chip,
                  color: theme.text, borderRadius:12, cursor:"pointer", fontWeight:800
                }}
              >
                Export JSON
              </button>

              <label style={{
                padding:"10px 14px", border:`1px solid ${theme.line}`, background: theme.chip,
                color: theme.text, borderRadius:12, cursor:"pointer", fontWeight:800
              }}>
                Import JSON…
                <input
                  type="file"
                  accept="application/json"
                  style={{ display:"none" }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const text = await f.text();
                      const arr = JSON.parse(text);
                      if (!Array.isArray(arr)) throw new Error("Bad file format");
                      setItems(arr);
                      alert("Imported " + arr.length + " item(s).");
                    } catch (err) {
                      alert("Import failed: " + (err?.message || err));
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
