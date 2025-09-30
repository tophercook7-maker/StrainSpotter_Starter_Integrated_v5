import React, { useEffect, useState } from "react";
import { imageToEmbedding, cosine, identifyStrainHybrid } from "./ai";
import StrainDetail from "./StrainDetail";
import GrowingGuide from "./GrowingGuide";
import AgeGate from "./AgeGate";
import HeroSection from "./HeroSection";
import { getAllStrains, searchStrains, findStrainsByType } from "./data/strainDatabase";

/* ====== LOCAL STORAGE KEY ====== */
const LS_KEY = "strainspotter_gallery_v1";

/* ====== HELPER FUNCTIONS ====== */
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

function toDownscaledCanvas(img, maxSide = 1024) {
  const w0 = img.naturalWidth || img.width || 1;
  const h0 = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToPreviewURL(canvas, quality = 0.9) {
  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return canvas.toDataURL();
  }
}

/* ====== MAIN APP COMPONENT ====== */
export default function StrainSpotterApp() {
  const [tab, setTab] = useState("identify");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selectedStrain, setSelectedStrain] = useState(null);
  const [viewMode, setViewMode] = useState("main"); // 'main', 'strain-detail', 'growing-guide'
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [ageVerified, setAgeVerified] = useState(false);

  const allStrains = getAllStrains();

  // Load gallery from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (err) {
      console.error("Failed to load gallery:", err);
    }
  }, []);

  // Save gallery to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to save gallery:", err);
    }
  }, [items]);

  // Handle photo classification
  const onClassify = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const { img, url } = await fileToImage(file);
      const canvas = toDownscaledCanvas(img, 1024);
      const previewURL = canvasToPreviewURL(canvas, 0.9);

      // Get AI identification
      const result = await identifyStrainHybrid(canvas);
      
      if (result && result.strain) {
        // Add to gallery
        const newItem = {
          id: Date.now(),
          previewURL,
          strainId: result.strain.id,
          strainName: result.strain.displayName,
          confidence: result.confidence,
          timestamp: new Date().toISOString(),
        };
        setItems((prev) => [newItem, ...prev]);

        // Show strain detail
        setSelectedStrain(result.strain);
        setViewMode("strain-detail");
      } else {
        alert("Could not identify strain. Please try another photo.");
      }

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Classification error:", err);
      alert("Error processing image: " + (err?.message || err));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  // Handle manual strain selection
  const handleStrainSelect = (strain) => {
    setSelectedStrain(strain);
    setViewMode("strain-detail");
  };

  // Handle back navigation
  const handleBack = () => {
    setViewMode("main");
    setSelectedStrain(null);
  };

  // Filter strains based on search and type
  const getFilteredStrains = () => {
    let filtered = allStrains;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(
        (s) => s.type.toLowerCase() === filterType.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchStrains(searchQuery);
    }

    return filtered;
  };

  // Check age verification
  useEffect(() => {
    const verified = localStorage.getItem('strainspotter_age_verified');
    setAgeVerified(!!verified);
  }, []);

  // Render age gate if not verified
  if (!ageVerified) {
    return <AgeGate onVerified={() => setAgeVerified(true)} />;
  }

  // Render strain detail view
  if (viewMode === "strain-detail" && selectedStrain) {
    return (
      <div className="app-container">
        <button onClick={handleBack} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
          ← Back to Main
        </button>
        <StrainDetail strain={selectedStrain} />
      </div>
    );
  }

  // Render growing guide view
  if (viewMode === "growing-guide" && selectedStrain) {
    return (
      <div className="app-container">
        <button onClick={handleBack} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
          ← Back to Main
        </button>
        <GrowingGuide strain={selectedStrain} />
      </div>
    );
  }

  // Main app view
  return (
    <div>
      <HeroSection />
      
      <div className="app-container">
        {/* Tab Navigation */}
        <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button
            className={`tab ${tab === "identify" ? "active" : ""}`}
            onClick={() => setTab("identify")}
          >
            📸 Identify Strain
          </button>
          <button
            className={`tab ${tab === "database" ? "active" : ""}`}
            onClick={() => setTab("database")}
          >
            🌿 Strain Database
          </button>
          <button
            className={`tab ${tab === "gallery" ? "active" : ""}`}
            onClick={() => setTab("gallery")}
          >
            🖼️ My Gallery ({items.length})
          </button>
          <button
            className={`tab ${tab === "growing" ? "active" : ""}`}
            onClick={() => setTab("growing")}
          >
            🌱 Growing Guide
          </button>
        </div>

        {/* IDENTIFY TAB */}
        {tab === "identify" && (
          <div className="card">
            <h2 style={{ marginBottom: '20px', color: '#2ecc71' }}>Identify Cannabis Strain</h2>
            
            <div className="camera-section">
              <div className="camera-icon">📷</div>
              <h3>Take or Upload a Photo</h3>
              <p style={{ color: '#b0b0b0', marginBottom: '20px' }}>
                Capture a clear photo of the cannabis plant or bud to identify the strain
              </p>
              
              <label className="btn" style={{ cursor: 'pointer' }}>
                {busy ? "Processing..." : "Choose Photo"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onClassify}
                  disabled={busy}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {busy && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <div className="spinner"></div>
                <p>Analyzing image...</p>
              </div>
            )}

            <div style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '15px' }}>How It Works</h3>
              <div className="info-item">
                <p><strong>1. Take a Photo:</strong> Capture a clear image of the cannabis plant or bud</p>
              </div>
              <div className="info-item">
                <p><strong>2. AI Analysis:</strong> Our AI analyzes visual features and characteristics</p>
              </div>
              <div className="info-item">
                <p><strong>3. Strain Match:</strong> Get the most likely strain with confidence score</p>
              </div>
              <div className="info-item">
                <p><strong>4. Full Details:</strong> View complete strain info, growing guide, and where to buy</p>
              </div>
            </div>
          </div>
        )}

        {/* DATABASE TAB */}
        {tab === "database" && (
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 style={{ marginBottom: '20px', color: '#2ecc71' }}>
                Strain Database ({getFilteredStrains().length} strains)
              </h2>
              
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search strains by name, effects, flavors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', marginBottom: '15px' }}
              />

              {/* Type Filter */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${filterType === "all" ? "" : "btn-secondary"}`}
                  onClick={() => setFilterType("all")}
                >
                  All Types
                </button>
                <button
                  className={`btn ${filterType === "indica" ? "" : "btn-secondary"}`}
                  onClick={() => setFilterType("indica")}
                >
                  Indica
                </button>
                <button
                  className={`btn ${filterType === "sativa" ? "" : "btn-secondary"}`}
                  onClick={() => setFilterType("sativa")}
                >
                  Sativa
                </button>
                <button
                  className={`btn ${filterType === "hybrid" ? "" : "btn-secondary"}`}
                  onClick={() => setFilterType("hybrid")}
                >
                  Hybrid
                </button>
              </div>
            </div>

            {/* Strain List */}
            <div style={{ display: 'grid', gap: '20px' }}>
              {getFilteredStrains().slice(0, 50).map((strain) => (
                <div
                  key={strain.id}
                  className="strain-card"
                  onClick={() => handleStrainSelect(strain)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="strain-header">
                    <h3 className="strain-name">{strain.displayName}</h3>
                    <span className={`strain-type ${strain.type.toLowerCase()}`}>
                      {strain.type}
                    </span>
                  </div>
                  
                  <p style={{ color: '#b0b0b0', margin: '10px 0', fontSize: '0.9rem' }}>
                    {strain.description?.substring(0, 150)}...
                  </p>

                  <div className="tags-container">
                    {strain.effects?.slice(0, 3).map((effect, i) => (
                      <span key={i} className="tag">{effect}</span>
                    ))}
                  </div>

                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                      THC: {strain.thcPercent}
                    </span>
                    <span style={{ color: '#b0b0b0', fontSize: '0.9rem' }}>
                      Click for details →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredStrains().length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p>No strains found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* GALLERY TAB */}
        {tab === "gallery" && (
          <div className="card">
            <h2 style={{ marginBottom: '20px', color: '#2ecc71' }}>My Gallery</h2>
            
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#b0b0b0', marginBottom: '20px' }}>
                  No photos yet. Start by identifying a strain!
                </p>
                <button className="btn" onClick={() => setTab("identify")}>
                  Identify Your First Strain
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {items.map((item) => (
                  <div key={item.id} className="card" style={{ padding: '15px' }}>
                    <img
                      src={item.previewURL}
                      alt={item.strainName}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        marginBottom: '10px'
                      }}
                    />
                    <h4 style={{ color: '#2ecc71', marginBottom: '5px' }}>
                      {item.strainName}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#b0b0b0', marginBottom: '10px' }}>
                      Confidence: {Math.round(item.confidence * 100)}%
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#888' }}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        if (confirm('Delete this photo?')) {
                          setItems(prev => prev.filter(i => i.id !== item.id));
                        }
                      }}
                      style={{ width: '100%', marginTop: '10px', padding: '8px' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GROWING GUIDE TAB */}
        {tab === "growing" && (
          <div className="card">
            <h2 style={{ marginBottom: '20px', color: '#2ecc71' }}>Growing Guide</h2>
            
            {!selectedStrain ? (
              <div>
                <p style={{ marginBottom: '20px', color: '#b0b0b0' }}>
                  Select a strain to view detailed growing information
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {allStrains.slice(0, 20).map((strain) => (
                    <button
                      key={strain.id}
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedStrain(strain);
                        setViewMode("growing-guide");
                      }}
                    >
                      {strain.displayName}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <GrowingGuide strain={selectedStrain} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}