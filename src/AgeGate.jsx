import React, { useState } from 'react';

function AgeGate({ onVerified }) {
  const [showGate, setShowGate] = useState(() => {
    // Check if user has already verified
    const verified = localStorage.getItem('strainspotter_age_verified');
    return !verified;
  });

  const handleVerify = (isOver21) => {
    if (isOver21) {
      localStorage.setItem('strainspotter_age_verified', 'true');
      setShowGate(false);
      if (onVerified) onVerified();
    } else {
      alert('You must be 21 or older to use this application.');
      window.location.href = 'https://www.google.com';
    }
  };

  if (!showGate) return null;

  return (
    <div className="age-gate">
      <div className="age-gate-content">
        <img 
          src="/cannabis-leaf-icon.svg" 
          alt="Cannabis Leaf" 
          className="age-gate-icon"
        />
        <h2>Age Verification Required</h2>
        <p>
          StrainSpotter provides information about cannabis strains.
          You must be 21 years of age or older to access this application.
        </p>
        <p style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.8 }}>
          By entering, you agree that you are of legal age in your jurisdiction.
        </p>
        <div className="age-gate-buttons">
          <button 
            onClick={() => handleVerify(true)}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            I'm 21 or Older
          </button>
          <button 
            onClick={() => handleVerify(false)}
            className="btn-secondary"
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            I'm Under 21
          </button>
        </div>
        <p style={{ 
          fontSize: '0.75rem', 
          marginTop: '20px', 
          opacity: 0.6,
          maxWidth: '400px',
          margin: '20px auto 0'
        }}>
          This application is for educational and informational purposes only. 
          Please consume responsibly and in accordance with local laws.
        </p>
      </div>
    </div>
  );
}

export default AgeGate;