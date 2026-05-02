import React from 'react';
import Fretboard from './Fretboard';
import { NOTES } from '../utils/musicLogic';
import Toggle from './shared/Toggle';
import Select from './shared/Select';
import styles from './ExploreMode.module.css';

const ExploreMode = ({ keyIndex, setKeyIndex, isMinor, setIsMinor, shape, setShape }) => {
  const [showPentatonic, setShowPentatonic] = React.useState(true);
  const [showChord, setShowChord] = React.useState(false);

  return (
    <div className={styles.exploreMode}>
      <div className={`${styles.controls} glass-panel`}>
        <Select label="Key" value={keyIndex} onChange={e => setKeyIndex(parseInt(e.target.value))}>
          {NOTES.map((n, i) => <option key={n} value={i}>{n}</option>)}
        </Select>
        
        <Select label="Scale" value={isMinor ? "minor" : "major"} onChange={e => setIsMinor(e.target.value === "minor")}>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </Select>
        
        <Select label="CAGED Shape" value={shape} onChange={e => setShape(e.target.value)}>
          <option value="C">C Shape</option>
          <option value="A">A Shape</option>
          <option value="G">G Shape</option>
          <option value="E">E Shape</option>
          <option value="D">D Shape</option>
        </Select>
        
        <div className={`${styles.controlGroup} ${styles.toggleGroup}`}>
          <label>Highlight Pentatonic</label>
          <Toggle id="pentatonic-toggle" checked={showPentatonic} onChange={setShowPentatonic} />
        </div>
        
        <div className={`${styles.controlGroup} ${styles.toggleGroup}`}>
          <label>Highlight Chord</label>
          <Toggle id="chord-toggle" checked={showChord} onChange={setShowChord} />
        </div>
      </div>
      
      <div className={`${styles.fretboardWrapper} glass-panel`}>
        <div className={styles.shapeInfo}>
          <h2>{NOTES[keyIndex]} {isMinor ? 'Minor' : 'Major'} - {shape} Shape</h2>
          <div>
            <p className={styles.pentatonicLegend}><span className={styles.pentatonicShadowDemo}></span> Pentatonic notes highlighted</p>
            <p className={styles.pentatonicLegend} style={{marginTop: '0.5rem'}}><span className={styles.chordLegendDemo}></span> Chord notes highlighted</p>
          </div>
        </div>
        <Fretboard keyIndex={keyIndex} isMinor={isMinor} shape={shape} showPentatonic={showPentatonic} showChord={showChord} />
      </div>
    </div>
  );
};

export default ExploreMode;
