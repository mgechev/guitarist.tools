import React from 'react';
import Fretboard from './Fretboard';
import { NOTES } from '../utils/musicLogic';

const ExploreMode = ({ keyIndex, setKeyIndex, isMinor, setIsMinor, shape, setShape }) => {
  const [showPentatonic, setShowPentatonic] = React.useState(true);

  return (
    <div className="explore-mode">
      <div className="controls glass-panel">
        <div className="control-group">
          <label>Key</label>
          <select value={keyIndex} onChange={e => setKeyIndex(parseInt(e.target.value))}>
            {NOTES.map((n, i) => <option key={n} value={i}>{n}</option>)}
          </select>
        </div>
        
        <div className="control-group">
          <label>Scale</label>
          <select value={isMinor ? "minor" : "major"} onChange={e => setIsMinor(e.target.value === "minor")}>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>CAGED Shape</label>
          <select value={shape} onChange={e => setShape(e.target.value)}>
            <option value="C">C Shape</option>
            <option value="A">A Shape</option>
            <option value="G">G Shape</option>
            <option value="E">E Shape</option>
            <option value="D">D Shape</option>
          </select>
        </div>
        
        <div className="control-group toggle-group">
          <label>Highlight Pentatonic</label>
          <div className="toggle-container">
            <input 
              type="checkbox" 
              id="pentatonic-toggle" 
              checked={showPentatonic}
              onChange={e => setShowPentatonic(e.target.checked)}
            />
            <label htmlFor="pentatonic-toggle" className="toggle-label"></label>
          </div>
        </div>
      </div>
      
      <div className="fretboard-wrapper glass-panel">
        <div className="shape-info">
          <h2>{NOTES[keyIndex]} {isMinor ? 'Minor' : 'Major'} - {shape} Shape</h2>
          <p className="pentatonic-legend"><span className="pentatonic-shadow-demo"></span> Pentatonic notes highlighted</p>
        </div>
        <Fretboard keyIndex={keyIndex} isMinor={isMinor} shape={shape} showPentatonic={showPentatonic} />
      </div>
    </div>
  );
};

export default ExploreMode;
