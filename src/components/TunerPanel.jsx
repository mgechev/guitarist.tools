import React from 'react';
import { NOTES } from '../utils/musicLogic';

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
    <div className="tuner-panel glass-panel fade-in">
      <div className="tuner-header">
        <h3>Guitar Tuner</h3>
        <button 
          className="close-panel-btn" 
          onClick={onClose}
          title="Close Tuner"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="tuner-content">
        <div className="tuner-note-display">
          <span className={`tuner-note ${isPerfect ? 'perfect' : ''}`}>{noteName}</span>
        </div>
        
        <div className="tuner-meter">
          <div className="tuner-scale">
            <span className="tuner-mark flat-mark">-50</span>
            <span className="tuner-mark center-mark">0</span>
            <span className="tuner-mark sharp-mark">+50</span>
          </div>
          <div className="tuner-needle-container">
            <div 
              className="tuner-needle" 
              style={{ 
                transform: `rotate(${needleRotation}deg)`,
                backgroundColor: needleColor 
              }}
            ></div>
            <div className="tuner-pivot"></div>
          </div>
        </div>

        <div className="tuner-status" style={{ color: needleColor }}>
          {statusText}
        </div>
      </div>
    </div>
  );
};

export default TunerPanel;
