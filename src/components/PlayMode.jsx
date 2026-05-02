import React from 'react';
import Fretboard from './Fretboard';
import styles from './PlayMode.module.css';

const PlayMode = ({ activeMidiNote }) => {
  return (
    <div className={styles.playMode}>
      <div className={`${styles.controlsPanel} glass-panel`} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Play Freely</h2>
      </div>

      <div className={`${styles.fretboardWrapper} glass-panel`}>
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
