import { useState, useEffect, useRef } from 'react';
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

    let timeoutId;
    // Only add it once exactly when count hits 2
    if (consecutiveNoteRef.current.count === 2) {
      const position = getTabPosition(midiNote);
      if (position) {
        timeoutId = setTimeout(() => {
          setPlayedNotes(prev => [
            ...prev, 
            { 
              id: Date.now() + Math.random(), 
              midiNote: midiNote, 
              ...position 
            }
          ]);
        }, 0);
      }
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
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
