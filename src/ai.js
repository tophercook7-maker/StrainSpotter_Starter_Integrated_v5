// Enhanced AI module with strain identification
import { findStrainByName } from './data/strainDatabase';
import { recognizeText, extractStrainNames } from './ocr';
import { enhancedCosine } from './enhancedImageMatching';

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

// Cosine similarity between two vectors
export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, norma = 0, normb = 0;
  for (let i=0; i<a.length; i++) {
    dot += a[i] * b[i];
    norma += a[i] * a[i];
    normb += b[i] * b[i];
  }
  return dot / (Math.sqrt(norma) * Math.sqrt(normb) || 1);
}

// Convert image to embedding
export async function imageToEmbedding(imgEl) {
  const clip = await ensureClip();
  const result = await clip.__call__(imgEl);
  return Array.from(result.data);
}

// Identify strain from image
export async function identifyStrain(imgEl, galleryMatches = [], options = {}) {
  const { useEnhancedMatching = true } = options;
  
  try {
    // Get embedding for the query image
    const canvas = imgEl instanceof HTMLCanvasElement ? imgEl : toCanvas(imgEl);
    const embedding = await imageToEmbedding(canvas);
    
    // If we have gallery matches, use them to help identify the strain
    if (galleryMatches && galleryMatches.length > 0) {
      // Find the best match from gallery
      const bestMatch = galleryMatches[0];
      
      // Try to find a strain with a similar name
      const strainName = bestMatch.name.toLowerCase();
      const strain = findStrainByName(strainName, true); // Use fuzzy matching
      
      if (strain) {
        return {
          strain,
          confidence: bestMatch.score,
          matchType: 'gallery',
          galleryMatch: bestMatch
        };
      }
    }
    
    // If no match from gallery, try direct strain matching
    // This would be more sophisticated in a real app with a strain embedding database
    // For demo purposes, we'll return a default strain
    return {
      strain: findStrainByName("Blue Dream"),
      confidence: 0.7,
      matchType: 'default',
      message: "No specific match found, showing a popular strain"
    };
  } catch (err) {
    console.error("Strain identification failed:", err);
    return null;
  }
}

// Enhanced hybrid strain identification using both visual and OCR
export async function identifyStrainHybrid(imgEl, galleryMatches = []) {
  console.log("Starting enhanced hybrid strain identification (visual + OCR)...");
  
  // First try OCR (give it priority)
  try {
    const canvas = imgEl instanceof HTMLCanvasElement ? imgEl : toCanvas(imgEl);
    console.log("Running OCR on image...");
    const recognizedText = await recognizeText(canvas);
    console.log("OCR completed, extracting potential strain names");
    const potentialNames = extractStrainNames(recognizedText);
    
    // Look for matches in the strain database with higher sensitivity
    const textMatches = potentialNames
      .map(name => {
        const strain = findStrainByName(name, true); // Add parameter for fuzzy matching
        return strain ? { 
          name, 
          strain,
          matchQuality: name.toLowerCase() === strain.displayName.toLowerCase() ? 0.95 :
                      strain.aka?.some(alias => alias.toLowerCase() === name.toLowerCase()) ? 0.9 :
                      0.85
        } : null;
      })
      .filter(Boolean);
    
    console.log(`Found ${textMatches.length} potential strain matches from OCR text`);
    
    // If we have OCR matches, they take precedence
    if (textMatches.length > 0) {
      return {
        strain: textMatches[0].strain,
        confidence: textMatches[0].matchQuality,
        matchType: 'text',
        recognizedText,
        allMatches: textMatches.map(m => m.strain)
      };
    }
  } catch (err) {
    console.error("OCR identification failed:", err);
  }
  
  // Then try visual identification with enhanced matching
  try {
    const visualResult = await identifyStrain(imgEl, galleryMatches, { useEnhancedMatching: true });
    if (visualResult) {
      return visualResult;
    }
  } catch (err) {
    console.error("Visual identification failed:", err);
  }
  
  // If all else fails, return a default strain as fallback
  return {
    strain: findStrainByName("Blue Dream"), // Default to a common strain
    confidence: 0.5,
    matchType: 'fallback',
    message: "Could not confidently identify strain, showing a popular option instead"
  };
}