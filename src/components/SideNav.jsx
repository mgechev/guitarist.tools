import React, { useState, useEffect } from 'react';

const SideNav = () => {
  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Sync with OS settings dynamically
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e) => setIsLightMode(e.matches);
    
    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isLightMode]);

  return (
    <nav className="sidenav">
      <div className="nav-profile">
        <div className="nav-logo">
          <div className="nav-logo-circle">C</div>
          <span className="nav-logo-text">CAGED Master</span>
        </div>
      </div>
      <div className="nav-links" style={{flex: 1}}>
        <a className="nav-item active" href="#" title="CAGED Master">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="nav-label">CAGED Master</span>
        </a>
      </div>
      
      <div className="nav-footer" style={{width: '100%', marginTop: 'auto'}}>
        <button 
          className="nav-item" 
          onClick={() => setIsLightMode(!isLightMode)}
          style={{background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: '0.75rem 1rem'}}
        >
          <span className="material-symbols-outlined">
            {isLightMode ? 'dark_mode' : 'light_mode'}
          </span>
          <span className="nav-label">{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </nav>
  );
};

export default SideNav;
