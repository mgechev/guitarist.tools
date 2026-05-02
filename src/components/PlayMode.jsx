import React, { useState } from 'react';
import Fretboard from './Fretboard';
import AudioInputTracker from './AudioInputTracker';

const PlayMode = () => {
  const [activeMidiNote, setActiveMidiNote] = useState(null);

  // In Play mode, we show the full fretboard without restricting to a specific scale/key/shape
  // We'll pass a dummy scale that includes all notes (0-11) so all played notes can be shown
  
  return (
    <div className="play-mode">
      <div className="controls-panel glass-panel" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ marginRight: '2rem' }}>Connect Your Instrument</h2>
        <AudioInputTracker onPitchDetected={setActiveMidiNote} />
      </div>

      <div className="fretboard-wrapper">
        <Fretboard 
          keyIndex={0} 
          isMinor={false} 
          shape="C"
          showPentatonic={false}
          showChord={false}
          activeMidiNote={activeMidiNote}
          isPlayMode={true}
        />
      </div>
    </div>
  );
};

export default PlayMode;
