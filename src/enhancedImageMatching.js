// Enhanced image matching for StrainSpotter
// This module improves the accuracy of plant and bud identification

import { imageToEmbedding, cosine } from './ai';

// Enhanced similarity calculation with weighted features
export function enhancedCosine(a, b, options = {}) {
  const {
    colorWeight = 1.0,
    textureWeight = 1.2,
    shapeWeight = 0.8,
  } = options;
  
  if (!a || !b || a.length !== b.length) {
    return 0;
  }
  
  // Split the embedding into color, texture and shape regions
  // For our 256-dim vector, we'll use:
  // - First 85 dimensions for color information
  // - Next 85 dimensions for texture information
  // - Last 86 dimensions for shape information
  const colorRegionSize = Math.floor(a.length / 3);
  const textureRegionSize = Math.floor(a.length / 3);
  const shapeRegionSize = a.length - colorRegionSize - textureRegionSize;
  
  // Calculate similarity for each region
  let colorSimilarity = 0;
  let textureSimilarity = 0;
  let shapeSimilarity = 0;
  
  // Color similarity
  for (let i = 0; i < colorRegionSize; i++) {
    colorSimilarity += a[i] * b[i];
  }
  
  // Texture similarity
  for (let i = colorRegionSize; i < colorRegionSize + textureRegionSize; i++) {
    textureSimilarity += a[i] * b[i];
  }
  
  // Shape similarity
  for (let i = colorRegionSize + textureRegionSize; i < a.length; i++) {
    shapeSimilarity += a[i] * b[i];
  }
  
  // Apply weights and normalize
  const weightedSimilarity = 
    (colorSimilarity * colorWeight + 
     textureSimilarity * textureWeight + 
     shapeSimilarity * shapeWeight) / 
    (colorWeight + textureWeight + shapeWeight);
  
  return weightedSimilarity;
}

// Enhanced image matching that considers multiple features
export async function enhancedImageMatching(queryCanvas, galleryItems, options = {}) {
  const {
    topResults = 5,
    confidenceThreshold = 0.65,
    enhancedWeighting = true,
    colorWeight = 1.0,
    textureWeight = 1.2,
    shapeWeight = 0.8,
  } = options;
  
  // Get embedding for query image
  const queryEmbedding = await imageToEmbedding(queryCanvas);
  
  // Calculate similarity scores with gallery items
  const scoredItems = galleryItems.map(item => {
    const similarity = enhancedWeighting 
      ? enhancedCosine(queryEmbedding, item.emb || [], { colorWeight, textureWeight, shapeWeight })
      : cosine(queryEmbedding, item.emb || []);
    
    return {
      ...item,
      score: similarity,
      confidence: calculateConfidence(similarity)
    };
  });
  
  // Sort by score and filter by confidence threshold
  const filteredResults = scoredItems
    .filter(item => item.score >= confidenceThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topResults);
  
  return filteredResults;
}

// Convert similarity score to confidence percentage
function calculateConfidence(similarityScore) {
  // Transform the similarity score (typically 0-1) to a confidence percentage
  // Apply a sigmoid-like curve to emphasize differences in the middle range
  const adjusted = (Math.tanh((similarityScore - 0.7) * 5) + 1) / 2;
  return Math.min(1, Math.max(0, adjusted)) * 100;
}

// Feature extraction for cannabis-specific characteristics
export function extractCannabisFeatures(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Extract color distribution (focus on greens for plants, purples/oranges for buds)
  const colorFeatures = extractColorFeatures(data);
  
  // Extract texture features (trichomes, leaf patterns, bud structure)
  const textureFeatures = extractTextureFeatures(data, width, height);
  
  // Extract shape features (leaf shape, bud structure)
  const shapeFeatures = extractShapeFeatures(data, width, height);
  
  return {
    colorFeatures,
    textureFeatures,
    shapeFeatures
  };
}

// Helper functions for feature extraction
function extractColorFeatures(data) {
  // Simple color histogram with emphasis on cannabis-relevant colors
  const greenBins = new Array(16).fill(0);  // Green channel histogram
  const purpleBins = new Array(16).fill(0); // Purple detection (R-B difference)
  const orangeBins = new Array(16).fill(0); // Orange detection (R-G ratio)
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Green channel binning (for leaf detection)
    const greenIndex = Math.floor(g / 16);
    greenBins[greenIndex]++;
    
    // Purple detection (high R and B, low G indicates purple)
    if (r > g && b > g) {
      const purpleIndex = Math.floor(((r + b) / 2 - g) / 16);
      if (purpleIndex >= 0 && purpleIndex < 16) {
        purpleBins[purpleIndex]++;
      }
    }
    
    // Orange detection (high R, medium G, low B indicates orange/amber)
    if (r > g && g > b) {
      const orangeIndex = Math.floor((r - b) / 16);
      if (orangeIndex >= 0 && orangeIndex < 16) {
        orangeBins[orangeIndex]++;
      }
    }
  }
  
  // Normalize histograms
  const totalPixels = data.length / 4;
  for (let i = 0; i < 16; i++) {
    greenBins[i] /= totalPixels;
    purpleBins[i] /= totalPixels;
    orangeBins[i] /= totalPixels;
  }
  
  return [...greenBins, ...purpleBins, ...orangeBins];
}

function extractTextureFeatures(data, width, height) {
  // Simplified texture analysis - we'll use edge detection as a proxy for texture
  const edgeMap = new Array(width * height).fill(0);
  const textureFeatures = new Array(16).fill(0);
  
  // Simple edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const idxLeft = (y * width + (x - 1)) * 4;
      const idxRight = (y * width + (x + 1)) * 4;
      const idxUp = ((y - 1) * width + x) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      
      // Calculate differences with neighbors
      const diffX = Math.abs(data[idx + 1] - data[idxLeft + 1]) + 
                    Math.abs(data[idx + 1] - data[idxRight + 1]);
      const diffY = Math.abs(data[idx + 1] - data[idxUp + 1]) + 
                    Math.abs(data[idx + 1] - data[idxDown + 1]);
      
      // Use green channel for edge detection (most informative for plants)
      edgeMap[y * width + x] = (diffX + diffY) / 4;
    }
  }
  
  // Create a histogram of edge strengths
  for (let i = 0; i < edgeMap.length; i++) {
    const binIndex = Math.min(15, Math.floor(edgeMap[i] / 16));
    textureFeatures[binIndex]++;
  }
  
  // Normalize
  for (let i = 0; i < 16; i++) {
    textureFeatures[i] /= edgeMap.length;
  }
  
  return textureFeatures;
}

function extractShapeFeatures(data, width, height) {
  // Simplified shape analysis using image moments
  const shapeFeatures = new Array(16).fill(0);
  
  // Calculate image moments
  let m00 = 0, m10 = 0, m01 = 0, m11 = 0, m20 = 0, m02 = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Use green channel for shape detection (most informative for plants)
      const val = data[idx + 1] / 255;
      
      m00 += val;
      m10 += x * val;
      m01 += y * val;
      m11 += x * y * val;
      m20 += x * x * val;
      m02 += y * y * val;
    }
  }
  
  // Avoid division by zero
  if (m00 === 0) m00 = 1;
  
  // Calculate center of mass
  const xc = m10 / m00;
  const yc = m01 / m00;
  
  // Calculate central moments
  let mu20 = m20 / m00 - xc * xc;
  let mu02 = m02 / m00 - yc * yc;
  let mu11 = m11 / m00 - xc * yc;
  
  // Calculate shape descriptors
  const theta = 0.5 * Math.atan2(2 * mu11, mu20 - mu02);
  const eccentricity = Math.sqrt(1 - Math.min(mu20, mu02) / Math.max(mu20, mu02));
  
  // Fill shape features array with these descriptors
  shapeFeatures[0] = xc / width;
  shapeFeatures[1] = yc / height;
  shapeFeatures[2] = Math.cos(theta);
  shapeFeatures[3] = Math.sin(theta);
  shapeFeatures[4] = eccentricity;
  shapeFeatures[5] = mu20 / (width * width);
  shapeFeatures[6] = mu02 / (height * height);
  shapeFeatures[7] = mu11 / (width * height);
  
  return shapeFeatures;
}