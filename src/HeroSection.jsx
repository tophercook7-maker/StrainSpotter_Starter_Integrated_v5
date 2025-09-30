import React from 'react';

function HeroSection() {
  return (
    <div className="hero-section">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <img 
          src="/cannabis-leaf-icon.svg" 
          alt="StrainSpotter - Cannabis Strain Identifier" 
          className="hero-icon-large"
        />
        <h1 className="hero-title">StrainSpotter</h1>
        <p className="hero-subtitle">
          AI-Powered Cannabis Strain Identification & Growing Guide
        </p>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">2,351+</div>
            <div className="stat-label">Strains</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">AI</div>
            <div className="stat-label">Powered</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">Expert</div>
            <div className="stat-label">Guides</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;