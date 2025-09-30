import React from 'react';

function HeroSection() {
  return (
    <div className="hero-section">
      <img 
        src="/cannabis-leaf-icon.svg" 
        alt="StrainSpotter Icon" 
        className="hero-icon"
      />
      <h1 className="hero-title">StrainSpotter</h1>
      <p className="hero-subtitle">
        AI-Powered Cannabis Strain Identification & Growing Guide
      </p>
    </div>
  );
}

export default HeroSection;