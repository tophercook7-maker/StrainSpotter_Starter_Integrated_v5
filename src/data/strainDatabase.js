// Comprehensive strain database for StrainSpotter
import expandedStrainsData from './expanded-strains-full.json';

// Get all strains from the database
export function getAllStrains() {
  return expandedStrainsData;
}

// Find a strain by ID
export function findStrainById(id) {
  return expandedStrainsData.find(strain => strain.id === id) || null;
}

// Find a strain by name with optional fuzzy matching
export function findStrainByName(name, fuzzyMatch = false) {
  if (!name) return null;
  
  const normalizedName = name.toLowerCase().trim();
  
  // First try exact match on display name
  const exactMatch = expandedStrainsData.find(
    strain => strain.displayName.toLowerCase() === normalizedName
  );
  if (exactMatch) return exactMatch;
  
  // Then try exact match on aliases
  const aliasMatch = expandedStrainsData.find(
    strain => strain.aka && strain.aka.some(alias => alias.toLowerCase() === normalizedName)
  );
  if (aliasMatch) return aliasMatch;
  
  // If fuzzy matching is enabled, try partial matches
  if (fuzzyMatch) {
    // Try partial match on display name
    const partialNameMatch = expandedStrainsData.find(
      strain => strain.displayName.toLowerCase().includes(normalizedName) ||
                normalizedName.includes(strain.displayName.toLowerCase())
    );
    if (partialNameMatch) return partialNameMatch;
    
    // Try partial match on aliases
    const partialAliasMatch = expandedStrainsData.find(
      strain => strain.aka && strain.aka.some(
        alias => alias.toLowerCase().includes(normalizedName) ||
                normalizedName.includes(alias.toLowerCase())
      )
    );
    if (partialAliasMatch) return partialAliasMatch;
    
    // Try word-by-word matching
    const words = normalizedName.split(/\s+/);
    if (words.length > 1) {
      for (const word of words) {
        if (word.length < 3) continue; // Skip short words
        
        const wordMatch = expandedStrainsData.find(
          strain => strain.displayName.toLowerCase().includes(word)
        );
        if (wordMatch) return wordMatch;
      }
    }
  }
  
  return null;
}

// Search strains by type
export function findStrainsByType(type) {
  const normalizedType = type.toLowerCase();
  return expandedStrainsData.filter(
    strain => strain.type.toLowerCase() === normalizedType
  );
}

// Search strains by effect
export function findStrainsByEffect(effect) {
  const normalizedEffect = effect.toLowerCase();
  return expandedStrainsData.filter(
    strain => strain.effects && strain.effects.some(
      e => e.toLowerCase().includes(normalizedEffect)
    )
  );
}

// Search strains by flavor
export function findStrainsByFlavor(flavor) {
  const normalizedFlavor = flavor.toLowerCase();
  return expandedStrainsData.filter(
    strain => strain.flavors && strain.flavors.some(
      f => f.toLowerCase().includes(normalizedFlavor)
    )
  );
}

// Get affiliate links for a strain
export function getAffiliateLinks(strainId) {
  const strain = findStrainById(strainId);
  return strain ? strain.seedSources || [] : [];
}

// Get random strains for featured section
export function getRandomStrains(count = 5) {
  const shuffled = [...expandedStrainsData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Get top-rated strains
export function getTopRatedStrains(count = 10) {
  // Since we don't have ratings in the new data, return random popular strains
  return getRandomStrains(count);
}

// Search strains with multiple criteria
export function searchStrains(query) {
  if (!query || query.trim() === '') {
    return expandedStrainsData;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return expandedStrainsData.filter(strain => {
    // Search in name
    if (strain.displayName.toLowerCase().includes(normalizedQuery)) return true;
    
    // Search in aliases
    if (strain.aka && strain.aka.some(alias => 
      alias.toLowerCase().includes(normalizedQuery)
    )) return true;
    
    // Search in type
    if (strain.type.toLowerCase().includes(normalizedQuery)) return true;
    
    // Search in effects
    if (strain.effects && strain.effects.some(effect => 
      effect.toLowerCase().includes(normalizedQuery)
    )) return true;
    
    // Search in flavors
    if (strain.flavors && strain.flavors.some(flavor => 
      flavor.toLowerCase().includes(normalizedQuery)
    )) return true;
    
    // Search in description
    if (strain.description && strain.description.toLowerCase().includes(normalizedQuery)) return true;
    
    return false;
  });
}

export default {
  getAllStrains,
  findStrainById,
  findStrainByName,
  findStrainsByType,
  findStrainsByEffect,
  findStrainsByFlavor,
  getAffiliateLinks,
  getRandomStrains,
  getTopRatedStrains,
  searchStrains
};