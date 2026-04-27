import React from 'react';
import Fretboard from './Fretboard';
import { NOTES } from '../utils/musicLogic';
import Toggle from './shared/Toggle';
import Select from './shared/Select';

const ExploreMode = ({ keyIndex, setKeyIndex, isMinor, setIsMinor, shape, setShape }) => {
  const [showPentatonic, setShowPentatonic] = React.useState(true);
  const [showChord, setShowChord] = React.useState(false);

  return (
    <div className="explore-mode">
      <div className="controls glass-panel">
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
        
        <div className="control-group toggle-group">
          <label>Highlight Pentatonic</label>
          <Toggle id="pentatonic-toggle" checked={showPentatonic} onChange={setShowPentatonic} />
        </div>
        
        <div className="control-group toggle-group">
          <label>Highlight Chord</label>
          <Toggle id="chord-toggle" checked={showChord} onChange={setShowChord} />
        </div>
      </div>
      
      <div className="fretboard-wrapper glass-panel">
        <div className="shape-info">
          <h2>{NOTES[keyIndex]} {isMinor ? 'Minor' : 'Major'} - {shape} Shape</h2>
          <div>
            <p className="pentatonic-legend"><span className="pentatonic-shadow-demo"></span> Pentatonic notes highlighted</p>
            <p className="pentatonic-legend" style={{marginTop: '0.5rem'}}><span className="chord-legend-demo"></span> Chord notes highlighted</p>
          </div>
        </div>
        <Fretboard keyIndex={keyIndex} isMinor={isMinor} shape={shape} showPentatonic={showPentatonic} showChord={showChord} />
      </div>
    </div>
  );
};

export default ExploreMode;
