import React, { useState, useEffect, useRef } from 'react';
import styles from './Visualizer.module.css';

const Visualizer = ({ activePitchData, activeAttackTime }) => {
  const [orbs, setOrbs] = useState([]);
  const containerRef = useRef(null);
  
  // Clean up old orbs every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOrbs(current => current.filter(orb => now - orb.id < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const previousNoteRef = useRef(null);
  const previousAttackRef = useRef(null);

  // Spawn new orb on attack or significant pitch change
  useEffect(() => {
    if (!activePitchData) return;
    
    const isNewAttack = activeAttackTime && activeAttackTime !== previousAttackRef.current;
    const isNewNote = activePitchData.midiNote && activePitchData.midiNote !== previousNoteRef.current;
    
    if (isNewAttack || isNewNote) {
      spawnOrb(activePitchData);
      previousNoteRef.current = activePitchData.midiNote;
      if (isNewAttack) previousAttackRef.current = activeAttackTime;
    }
  }, [activePitchData, activeAttackTime]);

  const spawnOrb = (pitchData) => {
    if (!containerRef.current) return;
    
    const { midiNote, clarity } = pitchData;
    
    // Don't spawn if it's purely noise
    if (clarity < 0.8) return;

    // Map midi note (approx 40 to 80 for guitar) to a hue (0 to 360)
    // E2 is 40, E6 is 88. 
    const hue = ((midiNote - 40) / 48) * 360;
    
    // Map midi note to vertical position (higher note = higher up)
    const normalizedHeight = Math.max(0, Math.min(1, (midiNote - 40) / 48));
    const verticalPos = 100 - (normalizedHeight * 80 + 10); // 10% to 90%
    
    // Randomize horizontal position slightly to make it ambient
    const horizontalPos = 20 + Math.random() * 60; // 20% to 80%
    
    const newOrb = {
      id: Date.now() + Math.random(),
      hue,
      left: `${horizontalPos}%`,
      top: `${verticalPos}%`,
    };

    setOrbs(current => [...current, newOrb]);
  };

  return (
    <div className={styles.visualizerContainer} ref={containerRef}>
      {orbs.length === 0 && (
        <div className={styles.emptyState}>
          Play your guitar to generate visuals...
        </div>
      )}
      
      {orbs.map(orb => (
        <div 
          key={orb.id} 
          className={styles.orb}
          style={{
            left: orb.left,
            top: orb.top,
            backgroundColor: `hsla(${orb.hue}, 80%, 60%, 0.6)`,
            boxShadow: `0 0 40px hsla(${orb.hue}, 100%, 70%, 0.8)`
          }}
        />
      ))}
    </div>
  );
};

export default Visualizer;
