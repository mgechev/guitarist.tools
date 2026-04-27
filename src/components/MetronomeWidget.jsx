import React, { useState, useEffect, useRef } from 'react';
import { metronome } from '../utils/metronomeLogic';
import Button from './shared/Button';
import Select from './shared/Select';

const MetronomeWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [subdivision, setSubdivision] = useState(1);
  const [visualTick, setVisualTick] = useState(null);

  const tapTimes = useRef([]);

  useEffect(() => {
    metronome.onTick = (isAccent, isBeat, isSub) => {
      if (isAccent) setVisualTick('accent');
      else if (isBeat) setVisualTick('beat');
      else setVisualTick('sub');
      
      setTimeout(() => setVisualTick(null), 100);
    };

    return () => {
      metronome.onTick = null;
      metronome.stop();
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      metronome.stop();
      setIsPlaying(false);
    } else {
      metronome.start();
      setIsPlaying(true);
    }
  };

  const handleTempoChange = (newTempo) => {
    setTempo(newTempo);
    metronome.setTempo(newTempo);
  };

  const handleBeatsChange = (newBeats) => {
    setBeatsPerBar(newBeats);
    metronome.setBeatsPerBar(newBeats);
  };

  const handleSubdivisionChange = (newSub) => {
    setSubdivision(newSub);
    metronome.setSubdivision(newSub);
  };

  const handleTap = () => {
    const now = performance.now();
    const times = tapTimes.current;
    times.push(now);
    
    if (times.length > 4) {
      times.shift();
    }
    
    if (times.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < times.length; i++) {
        totalDiff += (times[i] - times[i-1]);
      }
      const avgDiff = totalDiff / (times.length - 1);
      const tappedBpm = Math.round(60000 / avgDiff);
      const boundedBpm = Math.max(30, Math.min(tappedBpm, 300));
      handleTempoChange(boundedBpm);
    }
  };

  useEffect(() => {
    const clearTaps = () => {
      tapTimes.current = [];
    };
    const timer = setInterval(clearTaps, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="metronome-wrapper">
      {isOpen && (
        <div className="metronome-panel glass-panel fade-in">
          <div className="metronome-header">
            <h3>Metronome</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div className={`tick-indicator ${visualTick ? `active-${visualTick}` : ''}`}></div>
              <button 
                className="close-metronome-btn mobile-only" 
                onClick={() => setIsOpen(false)}
                style={{background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.25rem', display: 'flex'}}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="metronome-display">
            <span className="bpm-text">{tempo}</span>
            <span className="bpm-label">BPM</span>
          </div>

          <div className="metronome-controls-inner">
            <input 
              type="range" 
              min="30" max="300" 
              value={tempo} 
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
              className="bpm-slider"
            />
            
            <Button variant="secondary" className="tap-btn" onClick={handleTap}>
              Tap Tempo
            </Button>

            <div className="settings-row">
              <Select label="Time" value={beatsPerBar} onChange={e => handleBeatsChange(parseInt(e.target.value))}>
                {[2, 3, 4, 5, 6, 7, 8].map(b => (
                  <option key={b} value={b}>{b}/4</option>
                ))}
              </Select>

              <Select label="Notes" value={subdivision} onChange={e => handleSubdivisionChange(parseInt(e.target.value))}>
                <option value={1}>1/4</option>
                <option value={2}>1/8</option>
                <option value={3}>1/8 T</option>
                <option value={4}>1/16</option>
              </Select>
            </div>

            <Button className={`play-btn ${isPlaying ? 'playing' : ''}`} onClick={togglePlay}>
              <span className="material-symbols-outlined">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </Button>
          </div>
        </div>
      )}

      <button 
        className={`metronome-toggle ${isPlaying ? 'pulse' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Metronome"
      >
        <span className="material-symbols-outlined">
          timer
        </span>
      </button>
    </div>
  );
};

export default MetronomeWidget;
