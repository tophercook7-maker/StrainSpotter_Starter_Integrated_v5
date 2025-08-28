// Demo-mode AI: zero downloads, no WASM, no external models.
export async function ensureClip() {
  return {
    // Keep the same API shape as transformers' pipeline
    async __call__(input, opts) {
      // input can be { image: <canvas> } or canvas/img
      const img = input?.image || input;
      const canvas = img instanceof HTMLCanvasElement ? img : toCanvas(img);
      const vec = imageFingerprint256(canvas);
      // mimic transformers output
      return { data: new Float32Array(vec) };
    }
  };
}

function toCanvas(img) {
  const maxSide = 512;
  const w0 = img.naturalWidth || img.width || 1;
  const h0 = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return c;
}

// Very small 256-D grayscale histogram fingerprint + L2 norm
function imageFingerprint256(canvas) {
  const ctx = canvas.getContext("2d");
  const { width:w, height:h } = canvas;
  const data = ctx.getImageData(0,0,w,h).data;
  const bins = new Float32Array(256);
  for (let i=0; i<data.length; i+=4) {
    // luminance
    const y = Math.max(0, Math.min(255, Math.round(0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2])));
    bins[y] += 1;
  }
  // Normalize
  let norm = 0;
  for (let i=0;i<256;i++) norm += bins[i]*bins[i];
  norm = Math.sqrt(norm) || 1;
  for (let i=0;i<256;i++) bins[i] /= norm;
  return bins;
}

export async function imageToEmbedding(imgEl) {
  const extractor = await ensureClip();
  const c = imgEl instanceof HTMLCanvasElement ? imgEl : toCanvas(imgEl);
  const out = await extractor.__call__({ image: c }, { pooling: "mean", normalize: true });
  const data = out?.data ?? out;
  const f32 = data instanceof Float32Array ? data : new Float32Array(data);
  // Ensure L2 normalized
  let norm = 0; for (let i=0;i<f32.length;i++) norm += f32[i]*f32[i];
  norm = Math.sqrt(norm)||1; for (let i=0;i<f32.length;i++) f32[i] /= norm;
  return Array.from(f32);
}

export function cosine(a, b) {
  const n = Math.min(a.length, b.length);
  let dot = 0; for (let i=0;i<n;i++) dot += a[i]*b[i];
  return dot;
}
