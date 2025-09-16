import React from "react";

// Ratio visualization component
function IndicaSativaRatio({ indica = 50, sativa = 50, theme }) {
  const total = indica + sativa;
  const indicaPercent = Math.round((indica / total) * 100);
  const sativaPercent = 100 - indicaPercent;
  
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <div style={{ fontWeight: 700, color: theme.subtext }}>Indica {indicaPercent}%</div>
        <div style={{ fontWeight: 700, color: theme.subtext }}>Sativa {sativaPercent}%</div>
      </div>
      <div style={{ 
        height: 8, 
        borderRadius: 4, 
        background: `linear-gradient(to right, #7C3AED ${indicaPercent}%, #10B981 ${indicaPercent}%)`,
        overflow: "hidden"
      }}></div>
    </div>
  );
}

// Main strain detail component
export default function StrainDetail({ strain, theme }) {
  if (!strain) return null;
  
  return (
    <div style={{ 
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 18,
      padding: 16,
      background: theme.cardBg,
      marginTop: 16
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,.35))" }}>🍃</span>
        <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>{strain.displayName}</div>
        <div style={{ 
          background: theme.chip, 
          color: theme.subtext,
          padding: "4px 8px", 
          borderRadius: 999, 
          fontSize: 12, 
          fontWeight: 700 
        }}>
          {strain.type || "Hybrid"}
        </div>
      </div>
      
      {/* Indica/Sativa ratio */}
      <IndicaSativaRatio indica={strain.indica} sativa={strain.sativa} theme={theme} />
      
      {/* THC Content */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 4 }}>THC Content</div>
        <div style={{ fontSize: 16, color: theme.text }}>{strain.thc}</div>
      </div>
      
      {/* Effects */}
      {strain.effects && strain.effects.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 4 }}>Effects</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {strain.effects.map((effect, i) => (
              <div key={i} style={{ 
                background: theme.chip, 
                color: theme.text,
                padding: "4px 8px", 
                borderRadius: 999, 
                fontSize: 12, 
                fontWeight: 600,
                border: `1px solid ${theme.line}`
              }}>
                {effect}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Growing Info */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 4 }}>Growing Info</div>
        <div style={{ fontSize: 16, color: theme.text }}>{strain.grow}</div>
      </div>
      
      {/* Where to Buy */}
      {(strain.seeds && strain.seeds.length > 0) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 4 }}>Where to Buy Seeds</div>
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
      
      {/* Find Flower */}
      {(strain.flower && strain.flower.length > 0) && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.subtext, marginBottom: 4 }}>Find Flower</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {strain.flower.map((source, i) => (
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
                <span>🔍</span> {source.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}