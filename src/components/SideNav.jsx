import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './SideNav.module.css';

const SideNav = () => {
  const location = useLocation();
  const isCagedActive = location.pathname === '/explore' || location.pathname === '/practice';

  const [isLightMode, setIsLightMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
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

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
    if (!isLightMode) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <nav className={styles.sidenav}>
      <div className={styles.navProfile}>
        <div className={styles.navLogo}>
          <span className={styles.navLogoText}>guitarist.tools</span>
        </div>
      </div>
      <div className={styles.navLinks}>
        <NavLink 
          to="/explore" 
          className={`${styles.navItem} ${isCagedActive ? styles.active : ''}`}
          title="CAGED"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="nav-label">CAGED</span>
        </NavLink>
        <NavLink 
          to="/rhythm" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          title="Rhythm"
        >
          <span className="material-symbols-outlined">speed</span>
          <span className="nav-label">Rhythm</span>
        </NavLink>
        <NavLink 
          to="/play" 
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          title="Play"
        >
          <span className="material-symbols-outlined">music_note</span>
          <span className="nav-label">Play</span>
        </NavLink>
      </div>
      
      <div className={styles.navFooter}>
        <button 
          className={styles.navItem} 
          onClick={toggleTheme}
          title={isLightMode ? "Dark Mode" : "Light Mode"}
        >
          <span className="material-symbols-outlined">{isLightMode ? 'dark_mode' : 'light_mode'}</span>
          <span className="nav-label">{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </nav>
  );
};

export default SideNav;
