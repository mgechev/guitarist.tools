import { useState } from 'react';
import MetronomeWidget from './MetronomeWidget';
import TunerPanel from './TunerPanel';
import AudioInputTracker from './AudioInputTracker';
import styles from './ToolsMenuWidget.module.css';

const ToolsMenuWidget = ({ activePitchData, onPitchDetected, onAttackDetected, onAudioData, onConnectionChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'metronome', 'tuner', 'connect', null

  const toggleMenu = () => {
    if (activeTool) {
      setActiveTool(null);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const openTool = (tool) => {
    const nextTool = activeTool === tool ? null : tool;
    setActiveTool(nextTool);
    setIsMenuOpen(false); // Close menu when opening a tool
  };

  return (
    <>
      <div className={styles.toolsWidgetContainer}>
        {/* The pop-out menu list */}
        <div className={`${styles.toolsMenu} ${isMenuOpen ? styles.open : ''}`}>
          <button className={styles.toolBtn} onClick={() => openTool('connect')}>
            <span className={`material-symbols-outlined ${styles.materialIcon}`}>cable</span>
            <span>Connect Guitar</span>
          </button>
          
          <button className={styles.toolBtn} onClick={() => openTool('tuner')}>
            <span className={`material-symbols-outlined ${styles.materialIcon}`}>tune</span>
            <span>Tuner</span>
          </button>
          
          <button className={styles.toolBtn} onClick={() => openTool('metronome')}>
            <span className={`material-symbols-outlined ${styles.materialIcon}`}>timer</span>
            <span>Metronome</span>
          </button>
        </div>

        {/* Main Floating Action Button */}
        <button 
          className={`${styles.toolsToggleBtn} ${isMenuOpen ? styles.active : ''}`}
          onClick={toggleMenu}
          title="Tools"
        >
          <span className="material-symbols-outlined" style={{fontSize: '2rem'}}>
            add
          </span>
        </button>
      </div>

      {/* Render the active tool panels based on state */}
      <MetronomeWidget 
        isOpen={activeTool === 'metronome'} 
        onClose={() => setActiveTool(null)} 
      />
      
      {activeTool === 'tuner' && (
        <div className={styles.toolsWidgetContainer} style={{ bottom: '90px' }}>
          <TunerPanel 
            activePitchData={activePitchData} 
            onClose={() => setActiveTool(null)} 
          />
        </div>
      )}

      <div className={styles.toolsWidgetContainer} style={{ bottom: '90px', display: activeTool === 'connect' ? 'flex' : 'none' }}>
        <div className="glass-panel fade-in" style={{ padding: '1.5rem', width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Connect Guitar</h3>
            <button 
              onClick={() => setActiveTool(null)}
              style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex'}}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Connect your audio interface and select it below to enable pitch detection for the tuner and fretboard.
          </p>
          <AudioInputTracker 
            visible={activeTool === 'connect'} 
            onPitchDetected={onPitchDetected} 
            onAttackDetected={onAttackDetected} 
            onAudioData={onAudioData} 
            onConnectionChange={onConnectionChange} 
          />
        </div>
      </div>
    </>
  );
};

export default ToolsMenuWidget;
