import React from "react";

export default function GrowingGuide({ strain, theme }) {
  if (!strain) return null;
  
  // Basic growing information based on strain type
  const growingTips = {
    "Indica": [
      "Typically shorter plants with wider leaves",
      "Usually has a shorter flowering time (7-9 weeks)",
      "Often more resilient to temperature fluctuations",
      "Prefers slightly cooler temperatures during flowering",
      "Higher yields in less space due to compact structure"
    ],
    "Sativa": [
      "Typically taller plants with narrower leaves",
      "Usually has a longer flowering time (10-12+ weeks)",
      "Often requires more consistent temperatures",
      "Prefers warmer temperatures throughout growth",
      "May require more vertical space and training"
    ],
    "Hybrid": [
      "Characteristics depend on indica/sativa ratio",
      "Flowering time usually between 8-10 weeks",
      "Adaptable to various growing conditions",
      "Benefits from standard temperature range (70-80°F day, 60-70°F night)",
      "Training techniques like LST work well for yield optimization"
    ]
  };
  
  // Determine which tips to show based on strain type
  const tips = growingTips[strain.type] || growingTips["Hybrid"];
  
  return (
    <div style={{ 
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 18,
      padding: 16,
      background: theme.cardBg,
      marginTop: 16
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span>🌱</span>
        <div style={{ fontSize: 18, fontWeight: 900, color: theme.text }}>Growing Guide: {strain.displayName}</div>
      </div>
      
      {/* Climate Info */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 4 }}>Optimal Growing Conditions</div>
        <div style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>{strain.grow}</div>
      </div>
      
      {/* Flowering Time */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 4 }}>Flowering Time</div>
        <div style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
          {strain.floweringTime || (strain.grow && strain.grow.match(/(\d+)[-–](\d+)\s*wks/) ? 
            strain.grow.match(/(\d+)[-–](\d+)\s*wks/)[0] : "8-10 weeks")}
        </div>
      </div>
      
      {/* Growing Tips */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 8 }}>Growing Tips</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ 
              display: "flex", 
              gap: 8, 
              alignItems: "flex-start",
              fontSize: 14,
              color: theme.text
            }}>
              <div style={{ color: theme.primary }}>•</div>
              <div>{tip}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Difficulty */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 4 }}>Difficulty Level</div>
        <div style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
          {strain.difficulty || "Moderate"}
        </div>
      </div>
      
      {/* Seed Sources */}
      {(strain.seeds && strain.seeds.length > 0) && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 8 }}>Recommended Seed Sources</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {strain.seeds.map((source, i) => (
              <a 
                key={i}
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: "#60DBFB", 
                  textDecoration: "none",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>🌱</span> {source.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}