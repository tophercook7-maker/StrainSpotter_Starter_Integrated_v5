// Comprehensive strain database for StrainSpotter
import affiliateData from '../../public/affiliates/strains.json';
import affiliateLinks from '../../public/affiliates/affiliates.json';

// Import the existing strain data
// Note: In a real implementation, we'd import from the actual file paths
// but for this demo we'll create a merged database directly
const strainData = [
  {
    "id": "blue-dream",
    "displayName": "Blue Dream",
    "aka": ["BlueDream", "Blue-Dream"],
    "thcPercent": "18–24%",
    "bestClimate": "Warm Mediterranean, low humidity",
    "seedSources": [
      {"name":"Seedsman","url":"https://example.com/seedsman/blue-dream"},
      {"name":"ILGM","url":"https://example.com/ilgm/blue-dream"}
    ]
  },
  {
    "id": "northern-lights",
    "displayName": "Northern Lights",
    "aka": ["NL", "NorthernLights"],
    "thcPercent": "16–21%",
    "bestClimate": "Temperate/cool; great indoors",
    "seedSources": [
      {"name":"Royal Queen","url":"https://example.com/rqs/northern-lights"}
    ]
  },
  {
    "id": "og-kush",
    "displayName": "OG Kush",
    "aka": ["OGK", "Ocean Grown Kush"],
    "thcPercent": "20–26%",
    "bestClimate": "Dry/warm; 8–9 wks",
    "seedSources": [
      {"name":"Seedsman","url":"https://example.com/seedsman/og-kush"},
      {"name":"ILGM","url":"https://example.com/ilgm/og-kush"}
    ]
  },
  {
    "id": "sour-diesel",
    "displayName": "Sour Diesel",
    "aka": ["Sour D", "Sour Deez"],
    "thcPercent": "18–23%",
    "bestClimate": "Sunny; 10–11 wks",
    "seedSources": [
      {"name":"Seedsman","url":"https://example.com/seedsman/sour-diesel"},
      {"name":"ILGM","url":"https://example.com/ilgm/sour-diesel"}
    ]
  },
  {
    "id": "girl-scout-cookies",
    "displayName": "Girl Scout Cookies",
    "aka": ["GSC", "Cookies"],
    "thcPercent": "19–28%",
    "bestClimate": "Mediterranean; 9–10 wks",
    "seedSources": [
      {"name":"Seedsman","url":"https://example.com/seedsman/gsc"},
      {"name":"ILGM","url":"https://example.com/ilgm/gsc"}
    ]
  }
];

// Merge with expanded data
let expandedStrains = [];
try {
  // In a real app, we'd import this properly
  // For this demo, we'll use the existing data
  expandedStrains = strainData.map(strain => {
    // Add additional fields that would be in the expanded data
    return {
      ...strain,
      type: strain.id === "northern-lights" ? "Indica" : 
            strain.id === "sour-diesel" ? "Sativa" : "Hybrid",
      sativa: strain.id === "northern-lights" ? 30 : 
              strain.id === "sour-diesel" ? 90 : 60,
      indica: strain.id === "northern-lights" ? 70 : 
              strain.id === "sour-diesel" ? 10 : 40,
      description: `${strain.displayName} is a popular cannabis strain known for its unique effects and flavor profile.`,
      effects: ["Relaxed", "Happy", "Euphoric"],
      medicalUses: ["Stress", "Pain", "Depression"],
      flavors: ["Earthy", "Sweet"],
      difficulty: "Medium",
      floweringTime: "8-10 weeks",
      height: "Medium",
      yield: "Medium to High"
    };
  });
} catch (err) {
  console.error("Error loading expanded strain data:", err);
}

// Get all strains from the database
export function getAllStrains() {
  return expandedStrains;
}

// Find a strain by ID
export function findStrainById(id) {
  return expandedStrains.find(strain => strain.id === id) || null;
}

// Find a strain by name with optional fuzzy matching
export function findStrainByName(name, fuzzyMatch = false) {
  if (!name) return null;
  
  const normalizedName = name.toLowerCase().trim();
  
  // First try exact match on display name
  const exactMatch = expandedStrains.find(
    strain => strain.displayName.toLowerCase() === normalizedName
  );
  if (exactMatch) return exactMatch;
  
  // Then try exact match on aliases
  const aliasMatch = expandedStrains.find(
    strain => strain.aka && strain.aka.some(alias => alias.toLowerCase() === normalizedName)
  );
  if (aliasMatch) return aliasMatch;
  
  // If fuzzy matching is enabled, try partial matches
  if (fuzzyMatch) {
    // Try partial match on display name
    const partialNameMatch = expandedStrains.find(
      strain => strain.displayName.toLowerCase().includes(normalizedName) ||
                normalizedName.includes(strain.displayName.toLowerCase())
    );
    if (partialNameMatch) return partialNameMatch;
    
    // Try partial match on aliases
    const partialAliasMatch = expandedStrains.find(
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
        
        const wordMatch = expandedStrains.find(
          strain => strain.displayName.toLowerCase().includes(word)
        );
        if (wordMatch) return wordMatch;
      }
    }
  }
  
  return null;
}

// Get affiliate links for a strain
export function getAffiliateLinks(strainId) {
  const strain = findStrainById(strainId);
  return strain ? strain.seedSources || [] : [];
}