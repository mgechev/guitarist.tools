import React, { useState } from 'react';
import Fretboard from './Fretboard';
import { NOTES } from '../utils/musicLogic';
import Toggle from './shared/Toggle';
import Button from './shared/Button';

const SHAPES = ['C', 'A', 'G', 'E', 'D'];

const PracticeMode = () => {
  const [challenge, setChallenge] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showPentatonic, setShowPentatonic] = useState(true);
  const [showChord, setShowChord] = useState(false);
  const [allowedKeys, setAllowedKeys] = useState(NOTES.map((_, i) => i));
  const [allowedScales, setAllowedScales] = useState(['major', 'minor']);

  const toggleKey = (keyIndex) => {
    setAllowedKeys(prev => 
      prev.includes(keyIndex) 
        ? prev.filter(k => k !== keyIndex)
        : [...prev, keyIndex]
    );
  };

  const toggleScale = (scaleStr) => {
    setAllowedScales(prev => 
      prev.includes(scaleStr)
        ? prev.filter(s => s !== scaleStr)
        : [...prev, scaleStr]
    );
  };

  const pickRandom = () => {
    if (allowedKeys.length === 0 || allowedScales.length === 0) {
      alert('Please select at least one key and one scale!');
      return;
    }
    const randomKey = allowedKeys[Math.floor(Math.random() * allowedKeys.length)];
    const randomScaleStr = allowedScales[Math.floor(Math.random() * allowedScales.length)];
    const randomIsMinor = randomScaleStr === 'minor';
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    
    setChallenge({
      keyIndex: randomKey,
      isMinor: randomIsMinor,
      shape: randomShape
    });
    setShowAnswer(false);
  };

  return (
    <div className="practice-mode">
      <div className="controls glass-panel" style={{flexDirection: 'column', alignItems: 'center'}}>
        <div className="practice-header">
          <h2>Practice Mode</h2>
          <p style={{color: 'var(--text-secondary)'}}>Configure and test your knowledge of the CAGED system</p>
        </div>
        
        <div className="practice-config" style={{width: '100%', maxWidth: '600px', marginBottom: '2rem', textAlign: 'left', borderTop: '1px solid var(--panel-border)', borderBottom: '1px solid var(--panel-border)', padding: '1.5rem 0'}}>
          <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
            <div style={{flex: 1, minWidth: '150px'}}>
              <label style={{display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-primary)'}}>Scales</label>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                <Toggle id="scale-major-toggle" checked={allowedScales.includes('major')} onChange={() => toggleScale('major')} label="Major" />
                <Toggle id="scale-minor-toggle" checked={allowedScales.includes('minor')} onChange={() => toggleScale('minor')} label="Minor" />
              </div>
            </div>

            <div style={{flex: 2, minWidth: '250px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                <label style={{fontWeight: 600, color: 'var(--text-primary)'}}>Keys</label>
                <div>
                  <button onClick={() => setAllowedKeys(NOTES.map((_, i) => i))} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', marginRight: '0.5rem', textDecoration: 'underline'}}>All</button>
                  <button onClick={() => setAllowedKeys([])} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline'}}>None</button>
                </div>
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem 0.75rem'}}>
                {NOTES.map((note, i) => (
                  <div key={i} style={{minWidth: '60px'}}>
                    <Toggle id={`key-${i}-toggle`} checked={allowedKeys.includes(i)} onChange={() => toggleKey(i)} label={note} scale={0.8} labelStyle={{fontSize: '0.9rem'}} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="practice-actions">
          <Button onClick={pickRandom}>Pick Random Challenge</Button>
          {challenge && (
            <Button variant="secondary" onClick={() => setShowAnswer(true)} disabled={showAnswer}>
              Show Answer
            </Button>
          )}
        </div>
      </div>

      {challenge && (
        <div className="challenge-display glass-panel fade-in">
          <h3 className="challenge-text">
            Find the <span className="highlight-text">{NOTES[challenge.keyIndex]} {challenge.isMinor ? 'Minor' : 'Major'}</span> scale in the <span className="highlight-text">{challenge.shape} Shape</span>
          </h3>
        </div>
      )}

      {challenge && showAnswer && (
        <div className="fretboard-wrapper glass-panel reveal-animation">
          <div className="shape-info">
            <div className="legend-container">
              <p className="pentatonic-legend"><span className="pentatonic-shadow-demo"></span> Pentatonic notes highlighted</p>
              <p className="pentatonic-legend" style={{marginTop: '0.5rem'}}><span className="chord-legend-demo"></span> Chord notes highlighted</p>
            </div>
            <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
              <div className="control-group toggle-group horizontal-toggle">
                <label>Highlight Pentatonic</label>
                <Toggle id="practice-pentatonic-toggle" checked={showPentatonic} onChange={setShowPentatonic} />
              </div>
              <div className="control-group toggle-group horizontal-toggle">
                <label>Highlight Chord</label>
                <Toggle id="practice-chord-toggle" checked={showChord} onChange={setShowChord} />
              </div>
            </div>
          </div>
          <Fretboard 
            keyIndex={challenge.keyIndex} 
            isMinor={challenge.isMinor} 
            shape={challenge.shape} 
            showPentatonic={showPentatonic}
            showChord={showChord}
          />
        </div>
      )}
      
      {!challenge && (
        <div className="empty-state glass-panel">
          <p>Click "Pick Random Challenge" to begin.</p>
        </div>
      )}
    </div>
  );
};

export default PracticeMode;
