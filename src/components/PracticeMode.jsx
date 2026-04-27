import React, { useState } from 'react';
import Fretboard from './Fretboard';
import { NOTES } from '../utils/musicLogic';

const SHAPES = ['C', 'A', 'G', 'E', 'D'];

const PracticeMode = () => {
  const [challenge, setChallenge] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showPentatonic, setShowPentatonic] = useState(true);
  const [showChord, setShowChord] = useState(false);

  const pickRandom = () => {
    const randomKey = Math.floor(Math.random() * 12);
    const randomIsMinor = Math.random() > 0.5;
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
      <div className="controls glass-panel">
        <div className="practice-header">
          <h2>Practice Mode</h2>
          <p>Test your knowledge of the CAGED system!</p>
        </div>
        
        <div className="practice-actions">
          <button className="primary-btn" onClick={pickRandom}>Pick Random Challenge</button>
          {challenge && (
            <button className="secondary-btn" onClick={() => setShowAnswer(true)} disabled={showAnswer}>
              Show Answer
            </button>
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
            <div style={{display: 'flex', gap: '2rem'}}>
              <div className="control-group toggle-group horizontal-toggle">
                <label>Highlight Pentatonic</label>
                <div className="toggle-container">
                  <input 
                    type="checkbox" 
                    id="practice-pentatonic-toggle" 
                    checked={showPentatonic}
                    onChange={e => setShowPentatonic(e.target.checked)}
                  />
                  <label htmlFor="practice-pentatonic-toggle" className="toggle-label"></label>
                </div>
              </div>
              <div className="control-group toggle-group horizontal-toggle">
                <label>Highlight Chord</label>
                <div className="toggle-container">
                  <input 
                    type="checkbox" 
                    id="practice-chord-toggle" 
                    checked={showChord}
                    onChange={e => setShowChord(e.target.checked)}
                  />
                  <label htmlFor="practice-chord-toggle" className="toggle-label"></label>
                </div>
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
