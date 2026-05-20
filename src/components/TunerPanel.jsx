import { useState, useEffect } from 'react';
import { NOTES } from '../utils/musicLogic';
import styles from './TunerPanel.module.css';

const STANDARD_STRINGS = [
  { note: 'E', midi: 40, name: '6th' },
  { note: 'A', midi: 45, name: '5th' },
  { note: 'D', midi: 50, name: '4th' },
  { note: 'G', midi: 55, name: '3rd' },
  { note: 'B', midi: 59, name: '2nd' },
  { note: 'E', midi: 64, name: '1st' }
];

const TunerPanel = ({ activePitchData, onClose }) => {
  const isConnected = activePitchData !== undefined;
  
  // If not playing anything, show resting state
  const isPlaying = isConnected && activePitchData !== null;
  const noteName = isPlaying ? NOTES[activePitchData.midiNote % 12] : '-';
  const cents = isPlaying ? activePitchData.cents : 0;

  // Cents smoothing (low pass filter to avoid needle jitter)
  const [displayCents, setDisplayCents] = useState(0);

  useEffect(() => {
    const targetCents = isPlaying ? cents : 0;
    const frameId = requestAnimationFrame(() => {
      setDisplayCents(prev => prev * 0.8 + targetCents * 0.2);
    });
    return () => cancelAnimationFrame(frameId);
  }, [cents, isPlaying]);
  
  // Determine color and status
  const isPerfect = Math.abs(displayCents) < 5;
  const isSharp = displayCents > 5;
  const isFlat = displayCents < -5;
  
  let statusText = 'Play a string';
  let needleColor = 'var(--text-primary)';
  
  if (isPlaying) {
    if (isPerfect) {
      statusText = 'In Tune';
      needleColor = '#10b981'; // Green
    } else if (isSharp) {
      statusText = 'Too Sharp';
      needleColor = '#ef4444'; // Red
    } else if (isFlat) {
      statusText = 'Too Flat';
      needleColor = '#f59e0b'; // Orange
    }
  }

  // Find closest standard string to highlight
  let closestStringIdx = -1;
  if (isPlaying) {
    let minDiff = Infinity;
    STANDARD_STRINGS.forEach((str, idx) => {
      const diff = Math.abs(activePitchData.midiNote - str.midi);
      if (diff < minDiff) {
        minDiff = diff;
        closestStringIdx = idx;
      }
    });
    // Only highlight if within 3 semitones of standard open string notes
    if (Math.abs(activePitchData.midiNote - STANDARD_STRINGS[closestStringIdx].midi) > 3) {
      closestStringIdx = -1;
    }
  }

  // Map cents (-50 to 50) to rotation (-45deg to 45deg)
  const clampedCents = Math.max(-50, Math.min(50, displayCents));
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

        <div className={styles.stringsGuide}>
          {STANDARD_STRINGS.map((str, idx) => (
            <div 
              key={idx} 
              className={`${styles.stringGuideItem} ${closestStringIdx === idx ? styles.activeStringGuide : ''}`}
            >
              <span 
                className={styles.stringGuideNote} 
                style={closestStringIdx === idx ? { color: needleColor } : undefined}
              >
                {str.note}
              </span>
              <span className={styles.stringGuideNum}>{str.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TunerPanel;
