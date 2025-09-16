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
    "id": "white-widow",
    "displayName": "White Widow",
    "aka": ["WW"],
    "thcPercent": "20–25%",
    "bestClimate": "Indoors/Outdoors, Mediterranean climate",
    "seedSources": [
      {"name":"Seedsman - White Widow","url":"https://www.seedsman.com/search-results?q=White%20Widow"},
      {"name":"Crop King - White Widow","url":"https://www.cropkingseeds.com/?s=White+Widow"}
    ]
  }
];

// Merge all strain data into a single comprehensive database
export const strainDatabase = strainData.map(strain => {
  // Check if we have affiliate data for this strain
  const affiliateInfo = affiliateData[strain.displayName] || {};
  const affiliateSpecific = affiliateLinks[strain.displayName] || {};
  
  return {
    ...strain,
    type: affiliateInfo.type || "Hybrid",
    sativa: affiliateInfo.sativa || 50,
    indica: affiliateInfo.indica || 50,
    thc: strain.thcPercent || affiliateInfo.thc || "Unknown",
    grow: affiliateInfo.grow || strain.bestClimate || "Unknown",
    seeds: strain.seedSources || (affiliateSpecific.seeds ? affiliateSpecific.seeds : []),
    flower: affiliateSpecific.flower || [],
    effects: ["Relaxed", "Happy", "Euphoric"], // Default effects if not specified
    medicalUses: ["Stress", "Pain"], // Default medical uses if not specified
    flavors: ["Earthy", "Sweet"], // Default flavors if not specified
    difficulty: "Moderate", // Default difficulty if not specified
    floweringTime: strain.grow ? strain.grow.match(/(\d+)[-–](\d+)\s*wks/) ? strain.grow.match(/(\d+)[-–](\d+)\s*wks/)[0] : "8-10 weeks" : "8-10 weeks",
    description: `${strain.displayName} is a popular cannabis strain known for its unique effects and growing characteristics.`
  };
});

// Function to find the closest strain match by name
export function findStrainByName(name) {
  if (!name) return null;
  
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // First try exact match
  const exactMatch = strainDatabase.find(strain => 
    strain.displayName.toLowerCase() === name.toLowerCase() ||
    strain.aka?.some(alias => alias.toLowerCase() === name.toLowerCase())
  );
  
  if (exactMatch) return exactMatch;
  
  // Try fuzzy match
  return strainDatabase.find(strain => {
    const strainNormalized = strain.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return strainNormalized.includes(normalizedName) || normalizedName.includes(strainNormalized) ||
      strain.aka?.some(alias => alias.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedName));
  });
}

// Function to get all strains
export function getAllStrains() {
  return strainDatabase;
}

// Function to get strain by ID
export function getStrainById(id) {
  return strainDatabase.find(strain => strain.id === id);
}