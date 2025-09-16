// Enhanced AI module with strain identification
import { findStrainByName } from './data/strainDatabase';
import { recognizeText, extractStrainNames } from './ocr';

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

// Enhanced strain identification based on visual matching
export async function identifyStrain(imgEl, galleryMatches = []) {
  console.log("Starting strain identification from visual matches...");
  
  // First use visual matching from gallery
  const visualMatches = galleryMatches.slice(0, 3);
  
  // Check if any gallery matches have names that match known strains
  const potentialStrains = visualMatches
    .map(match => {
      const strain = findStrainByName(match.name);
      return strain ? { 
        strain, 
        score: match.score,
        // Calculate confidence score based on match quality
        confidence: match.score > 0.9 ? 0.95 : 
                   match.score > 0.8 ? 0.85 : 
                   match.score > 0.7 ? 0.75 : 
                   match.score > 0.6 ? 0.65 : 0.5
      } : null;
    })
    .filter(Boolean);
  
  console.log(`Found ${potentialStrains.length} potential strain matches from visual similarity`);
  
  // If we found matches in our database, return the top one with confidence
  if (potentialStrains.length > 0) {
    return {
      strain: potentialStrains[0].strain,
      confidence: potentialStrains[0].confidence,
      score: potentialStrains[0].score,
      matchType: 'visual',
      allMatches: potentialStrains.map(p => p.strain)
    };
  }
  
  // If no matches, return null
  return null;
}

// Enhanced function that combines visual and OCR for hybrid identification
export async function identifyStrainHybrid(imgEl, galleryMatches = []) {
  console.log("Starting enhanced hybrid strain identification (visual + OCR)...");
  
  // First try visual identification
  const visualResult = await identifyStrain(imgEl, galleryMatches);
  
  // Then try OCR
  try {
    const canvas = imgEl instanceof HTMLCanvasElement ? imgEl : toCanvas(imgEl);
    console.log("Running OCR on image...");
    const recognizedText = await recognizeText(canvas);
    console.log("OCR completed, extracting potential strain names");
    const potentialNames = extractStrainNames(recognizedText);
    
    // Look for matches in the strain database
    const textMatches = potentialNames
      .map(name => {
        const strain = findStrainByName(name);
        return strain ? { 
          name, 
          strain,
          // Calculate match quality based on exact vs. partial match
          matchQuality: name.toLowerCase() === strain.displayName.toLowerCase() ? 0.95 :
                        strain.aka?.some(alias => alias.toLowerCase() === name.toLowerCase()) ? 0.9 :
                        0.85
        } : null;
      })
      .filter(Boolean);
    
    console.log(`Found ${textMatches.length} potential strain matches from OCR text`);
    
    // If we have OCR matches, they take precedence (text on packaging is usually accurate)
    if (textMatches.length > 0) {
      return {
        strain: textMatches[0].strain,
        confidence: textMatches[0].matchQuality, // Higher confidence for text matches
        matchType: 'text',
        recognizedText,
        allMatches: textMatches.map(m => m.strain)
      };
    }
  } catch (err) {
    console.error("OCR identification failed:", err);
    // Continue with visual results if OCR fails
  }
  
  // If we have a visual result, return it
  if (visualResult) {
    return visualResult;
  }
  
  // If no matches found, try a more aggressive fuzzy matching approach
  try {
    const canvas = imgEl instanceof HTMLCanvasElement ? imgEl : toCanvas(imgEl);
    // Extract dominant colors from the image
    const colorProfile = extractColorProfile(canvas);
    
    // Match color profile against known strain characteristics
    const colorMatches = matchStrainsByColor(colorProfile);
    
    if (colorMatches.length > 0) {
      return {
        strain: colorMatches[0].strain,
        confidence: 0.6, // Lower confidence for color-based matches
        matchType: 'color',
        allMatches: colorMatches.map(m => m.strain)
      };
    }
  } catch (err) {
    console.error("Color matching failed:", err);
  }
  
  // No matches found
  return null;
}

// Extract color profile from image
function extractColorProfile(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  
  // Calculate average RGB
  let totalR = 0, totalG = 0, totalB = 0;
  const pixelCount = width * height;
  
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }
  
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  
  // Calculate green-to-red ratio (higher in sativas)
  const greenToRedRatio = avgG / (avgR || 1);
  
  // Calculate purple intensity (higher in some indicas)
  const purpleIntensity = (avgR + avgB) / (2 * (avgG || 1));
  
  return {
    avgR, avgG, avgB,
    greenToRedRatio,
    purpleIntensity
  };
}

// Match strains by color characteristics
function matchStrainsByColor(colorProfile) {
  // Simplified color matching based on common strain characteristics
  const { greenToRedRatio, purpleIntensity } = colorProfile;
  
  // Import all strains
  const allStrains = require('./data/strainDatabase').getAllStrains();
  
  // Score strains based on color profile
  const scoredStrains = allStrains.map(strain => {
    let score = 0;
    
    // Sativas tend to be more green
    if (strain.type === 'Sativa' && greenToRedRatio > 1.2) {
      score += 0.3;
    }
    
    // Indicas often have purple hues
    if (strain.type === 'Indica' && purpleIntensity > 1.1) {
      score += 0.3;
    }
    
    // Hybrids fall in between
    if (strain.type === 'Hybrid') {
      score += 0.2;
    }
    
    // Specific strain color matching
    if (strain.displayName.toLowerCase().includes('purple') && purpleIntensity > 1.1) {
      score += 0.3;
    }
    
    if (strain.displayName.toLowerCase().includes('green') && greenToRedRatio > 1.2) {
      score += 0.3;
    }
    
    if (strain.displayName.toLowerCase().includes('blue') && colorProfile.avgB > colorProfile.avgR) {
      score += 0.3;
    }
    
    return { strain, score };
  });
  
  // Sort by score and return top matches
  return scoredStrains
    .filter(item => item.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
