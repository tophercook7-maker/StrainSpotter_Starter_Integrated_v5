// Test script for StrainSpotter app
import { imageToEmbedding, identifyStrainHybrid } from './ai';
import { recognizeText } from './ocr';
import { strainDatabase, getAllStrains } from './data/strainDatabase';

// Test functions
async function runTests() {
  console.log("=== StrainSpotter Test Suite ===");
  
  // Test 1: Strain Database
  console.log("\n1. Testing Strain Database");
  const allStrains = getAllStrains();
  console.log(`Total strains in database: ${allStrains.length}`);
  console.log("Sample strain:", allStrains[0]);
  
  // Test 2: OCR (mock)
  console.log("\n2. Testing OCR Module");
  console.log("OCR module imported successfully");
  
  // Test 3: Image Processing (mock)
  console.log("\n3. Testing Image Processing");
  console.log("Image processing module imported successfully");
  
  // Test 4: Strain Identification (mock)
  console.log("\n4. Testing Strain Identification Logic");
  const mockStrain = allStrains[0];
  console.log(`Mock identification result: ${mockStrain.displayName}`);
  
  console.log("\n=== All Tests Complete ===");
}

// Export for use in browser console
window.runStrainSpotterTests = runTests;

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
  console.log("StrainSpotter in development mode. Run tests with window.runStrainSpotterTests()");
}

export { runTests };