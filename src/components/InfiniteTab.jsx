import React, { useState, useEffect, useRef } from 'react';
import TabDisplay from './TabDisplay';
import { getTabPosition } from '../utils/musicLogic';

const InfiniteTab = ({ activePitchData }) => {
  const [playedNotes, setPlayedNotes] = useState([]);
  const consecutiveNoteRef = useRef({ note: null, count: 0 });

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

    // Only add it once exactly when count hits 3
    if (consecutiveNoteRef.current.count === 3) {
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
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <TabDisplay 
        notes={playedNotes} 
        onClear={() => setPlayedNotes([])} 
      />
    </div>
  );
};

export default InfiniteTab;
