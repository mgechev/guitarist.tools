import React from 'react';
import { NOTES } from '../utils/musicLogic';
import styles from './TunerPanel.module.css';

const TunerPanel = ({ activePitchData, onClose }) => {
  const isConnected = activePitchData !== undefined;
  
  // If not playing anything, show resting state
  const isPlaying = isConnected && activePitchData !== null;
  const noteName = isPlaying ? NOTES[activePitchData.midiNote % 12] : '-';
  const cents = isPlaying ? activePitchData.cents : 0;
  
  // Determine color and status
  const isPerfect = Math.abs(cents) < 5;
  const isSharp = cents > 5;
  const isFlat = cents < -5;
  
  let statusText = 'Play a string';
  let needleColor = 'var(--text-color)';
  
  if (isPlaying) {
    if (isPerfect) {
      statusText = 'In Tune';
      needleColor = '#10b981'; // Green
    } else if (isSharp) {
      statusText = 'Too Sharp';
      needleColor = '#ef4444'; // Red
    } else {
      statusText = 'Too Flat';
      needleColor = '#f59e0b'; // Orange
    }
  }

  // Map cents (-50 to 50) to rotation (-45deg to 45deg)
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needleRotation = clampedCents * 0.9; 

  return (
    <div className={`${styles.tunerPanel} glass-panel fade-in`}>
      <div className={styles.tunerHeader}>
        <h3>Guitar Tuner</h3>
        <button 
          onClick={onClose}
          title="Close Tuner"
          style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex'}}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className={styles.tunerContent}>
        <div className={styles.tunerNoteDisplay}>
          <span className={`${styles.tunerNote} ${isPerfect ? styles.perfect : ''}`}>{noteName}</span>
        </div>
        
        <div className={styles.tunerMeter}>
          <div className={styles.tunerScale}>
            {/* The marks are visually represented by border-top dashed line now */}
          </div>
          <div className={styles.tunerNeedleContainer} style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}>
            <div 
              className={styles.tunerNeedle} 
              style={{ backgroundColor: needleColor }}
            ></div>
          </div>
          <div className={styles.tunerPivot}></div>
        </div>

        <div className={styles.tunerStatus} style={{ color: needleColor }}>
          {statusText}
        </div>
      </div>
    </div>
  );
};

export default TunerPanel;
