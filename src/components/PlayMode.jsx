import React, { useState, useEffect, useRef } from 'react';
import TabDisplay from './TabDisplay';
import { getTabPosition } from '../utils/musicLogic';
import styles from './PlayMode.module.css';

const PlayMode = ({ activePitchData }) => {
  const [playedNotes, setPlayedNotes] = useState([]);
  const consecutiveNoteRef = useRef({ note: null, count: 0 });
  const activeMidiNote = activePitchData?.midiNote || null;

  useEffect(() => {
    if (!activePitchData) {
      consecutiveNoteRef.current = { note: null, count: 0 };
      return;
    }

    const midiNote = activePitchData.midiNote;

    // Debounce logic: wait for 5 consecutive frames
    if (consecutiveNoteRef.current.note === midiNote) {
      consecutiveNoteRef.current.count += 1;
    } else {
      consecutiveNoteRef.current = { note: midiNote, count: 1 };
    }

    // Only add it once exactly when count hits 5
    if (consecutiveNoteRef.current.count === 5) {
      const position = getTabPosition(midiNote);
      if (position) {
        setPlayedNotes(prev => [
          ...prev, 
          { 
            id: Date.now() + Math.random(), 
            midiNote: midiNote, 
            ...position 
          }
        ]);
      }
    }
  }, [activePitchData]);

  return (
    <div className={styles.playMode} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <TabDisplay 
        notes={playedNotes} 
        onClear={() => setPlayedNotes([])} 
      />
    </div>
  );
};

export default PlayMode;
