import React, { useState } from "react";
import { ensureClip } from "./ai";

export default function Diagnostics() {
  const [log, setLog] = useState([]);

  function add(line) {
    setLog((l) => [...l, line].slice(-200));
  }

  async function runModelSelfTest() {
    setLog([]);
    add("Starting model self-test…");
    try {
      const t0 = performance.now();
      const extractor = await ensureClip();
      add("✓ ensureClip() resolved.");
      const c = document.createElement("canvas");
      c.width = 8; c.height = 8;
      const out = await extractor({ image: c }, { pooling: "mean", normalize: true });
      const t1 = performance.now();
      const arr = out?.data ?? out;
      add(`✓ pipeline ran. output length: ${arr?.length ?? "?"}`);
      add(`Done in ${(t1 - t0).toFixed(0)} ms`);
    } catch (e) {
      const msg = String(e?.stack || e?.message || e);
      add("✗ Model self-test failed:");
      add(msg);
      alert("Model self-test error:\n" + msg);
    }
  }

  async function runNetworkProbe() {
    setLog([]);  async function runLocalFileProbe() {
    setLog([]);
    try {
      const origin = (window.location && window.location.origin) || "capacitor://localhost";
      const url = origin + "/models/clip-vit-base-patch16/config.json";
      setLog(l => [...l, "GET " + url]);
      const r = await fetch(url);
      setLog(l => [...l, `→ ${r.status} ${r.statusText}`]);
      const text = await r.text();
      setLog(l => [...l, `… received ${text.slice(0, 100).replace(/\s+/g, " ")}…`]);
      alert("Local file probe OK");
    } catch (e) {
      const msg = String(e?.stack || e?.message || e);
      setLog(l => [...l, "✗ Local file probe failed:", msg]);
      alert("Local file probe error:\n" + msg);
    }
  }
    add("Starting network probe…");
    try {
      const urls = [
        "https://huggingface.co/api/models/Xenova/clip-vit-base-patch16",
        "https://cdn-lfs.huggingface.co/Xenova/clip-vit-base-patch16/resolve/main/config.json"
      ];
      for (const u of urls) {
        add("GET " + u);
        const r = await fetch(u, { mode: "cors" });
        add(`→ ${r.status} ${r.statusText}`);
        const text = await r.text();
        add(`… received ${text.slice(0, 80).replace(/\s+/g, " ")}…`);
      }
      alert("Network probe OK.");
    } catch (e) {
      const msg = String(e?.stack || e?.message || e);
      add("✗ Network probe failed:");
      add(msg);
      alert("Network probe error:\n" + msg);
    }
  }

  return (
    <div style={{border:"1px dashed #CBD5E1", borderRadius:12, padding:12, marginTop:12}}>
      <div style={{fontWeight:600, marginBottom:8}}>Diagnostics</div>
      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        <button onClick={runModelSelfTest} style={{ padding:"8px 12px", border:"1px solid #E2E8F0", borderRadius:12, background:"#fff" }}>
          Run Model Self-Test
        </button>
        <button onClick={runNetworkProbe} style={{ padding:"8px 12px", border:"1px solid #E2E8F0", borderRadius:12, background:"#fff" }}>
          Network Probe
        </button>
      </div>
      <pre style={{marginTop:12, whiteSpace:"pre-wrap", fontSize:12, color:"#334155"}}>{log.join("\n")}</pre>
    </div>
  );
}