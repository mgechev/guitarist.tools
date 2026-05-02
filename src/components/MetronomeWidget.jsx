import React, { useState, useEffect, useRef } from 'react';
import { metronome } from '../utils/metronomeLogic';
import Button from './shared/Button';
import Select from './shared/Select';
import styles from './MetronomeWidget.module.css';

const MetronomeWidget = ({ isOpen, onClose }) => {
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
    <div className={styles.metronomeWrapper}>
      {isOpen && (
        <div className={`${styles.metronomePanel} glass-panel fade-in`}>
          <div className={styles.metronomeHeader}>
            <h3>Metronome</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div className={`${styles.tickIndicator} ${visualTick ? styles['active' + visualTick.charAt(0).toUpperCase() + visualTick.slice(1)] : ''}`}></div>
              <button 
                onClick={onClose}
                style={{background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.25rem', display: 'flex'}}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className={styles.metronomeDisplay}>
            <span className={styles.bpmText}>{tempo}</span>
            <span className={styles.bpmLabel}>BPM</span>
          </div>

          <div className={styles.metronomeControlsInner}>
            <input 
              type="range" 
              min="30" max="300" 
              value={tempo} 
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
              className={styles.bpmSlider}
            />
            
            <Button variant="secondary" className={styles.tapBtn} onClick={handleTap}>
              Tap Tempo
            </Button>

            <div className={styles.settingsRow}>
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

            <Button variant={isPlaying ? 'secondary' : 'primary'} onClick={togglePlay}>
              <span className="material-symbols-outlined" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetronomeWidget;
