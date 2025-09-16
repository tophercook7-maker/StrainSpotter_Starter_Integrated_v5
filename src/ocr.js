// OCR functionality for StrainSpotter using Tesseract.js
import { createWorker } from 'tesseract.js';

let ocrWorker = null;

// Initialize the OCR worker
export async function ensureOCR() {
  if (!ocrWorker) {
    console.log("Initializing OCR worker...");
    try {
      ocrWorker = await createWorker('eng');
      console.log("OCR worker initialized successfully");
    } catch (err) {
      console.error("Failed to initialize OCR worker:", err);
      throw new Error("OCR initialization failed: " + (err.message || err));
    }
  }
  return ocrWorker;
}

// Recognize text from an image canvas
export async function recognizeText(canvas) {
  try {
    console.log("Starting OCR text recognition...");
    const worker = await ensureOCR();
    
    // Convert canvas to blob if needed
    let imageSource = canvas;
    if (canvas instanceof HTMLCanvasElement) {
      // Get blob from canvas
      imageSource = await new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
      });
    }
    
    const result = await worker.recognize(imageSource);
    console.log("OCR recognition complete");
    return result.data.text;
  } catch (err) {
    console.error("OCR recognition failed:", err);
    return "";
  }
}

// Extract potential strain names from recognized text
export function extractStrainNames(text) {
  if (!text) return [];
  
  console.log("Extracting potential strain names from OCR text");
  // Common strain name patterns
  const lines = text.split('\n');
  
  // Filter lines that might be strain names (longer than 3 chars, not just numbers)
  const potentialNames = lines
    .map(line => line.trim())
    .filter(line => line.length > 3 && !/^\d+(\.\d+)?%?$/.test(line));
  
  // Remove very long lines (likely paragraphs, not names)
  const filteredNames = potentialNames.filter(name => name.length < 30);
  
  console.log(`Found ${filteredNames.length} potential strain names`);
  return filteredNames;
}

// Clean up OCR worker when no longer needed
export async function cleanupOCR() {
  if (ocrWorker) {
    try {
      await ocrWorker.terminate();
      ocrWorker = null;
      console.log("OCR worker terminated");
    } catch (err) {
      console.error("Error terminating OCR worker:", err);
    }
  }
}