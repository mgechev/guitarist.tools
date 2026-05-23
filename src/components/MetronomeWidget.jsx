import { useState, useEffect, useRef } from 'react';
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
  const [soundType, setSoundType] = useState('synth');
  const [activeBeat, setActiveBeat] = useState(0);

  const tapTimes = useRef([]);

  useEffect(() => {
    metronome.onTick = (isAccent, isBeat, isSub, beatIndex) => {
      if (isAccent) setVisualTick('accent');
      else if (isBeat) setVisualTick('beat');
      else setVisualTick('sub');
      
      if (isBeat || isAccent) {
        setActiveBeat(beatIndex || 0);
      }
      
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
    const boundedTempo = Math.max(30, Math.min(newTempo, 300));
    setTempo(boundedTempo);
    metronome.setTempo(boundedTempo);
  };

  const handleBeatsChange = (newBeats) => {
    setBeatsPerBar(newBeats);
    metronome.setBeatsPerBar(newBeats);
    setActiveBeat(0);
  };

  const handleSubdivisionChange = (newSub) => {
    setSubdivision(newSub);
    metronome.setSubdivision(newSub);
  };

  const handleSoundTypeChange = (newType) => {
    setSoundType(newType);
    metronome.setSoundType(newType);
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
          <button 
            onClick={onClose}
            className={styles.closeBtn}
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Beat visualizer row */}
          <div className={styles.beatIndicatorsRow}>
            {Array.from({ length: beatsPerBar }).map((_, i) => (
              <div 
                key={i} 
                className={`
                  ${styles.beatIndicatorDot} 
                  ${isPlaying && activeBeat === i ? styles.activeDot : ''} 
                  ${isPlaying && activeBeat === i && visualTick === 'accent' ? styles.activeAccentDot : ''}
                  ${i === 0 ? styles.accentDot : ''}
                `}
              />
            ))}
          </div>

          <div className={styles.displayContainer}>
            <button 
              className={styles.adjustBtn} 
              onClick={() => handleTempoChange(tempo - 1)}
              disabled={tempo <= 30}
              title="Decrease Tempo"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>

            <div className={styles.metronomeDisplay}>
              <span className={styles.bpmText}>{tempo}</span>
              <span className={styles.bpmLabel}>BPM</span>
            </div>

            <button 
              className={styles.adjustBtn} 
              onClick={() => handleTempoChange(tempo + 1)}
              disabled={tempo >= 300}
              title="Increase Tempo"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
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

              <Select label="Sound" value={soundType} onChange={e => handleSoundTypeChange(e.target.value)}>
                <option value="synth">Synth</option>
                <option value="woodblock">Woodblock</option>
                <option value="cowbell">Cowbell</option>
              </Select>
            </div>

            <Button variant={isPlaying ? 'secondary' : 'primary'} onClick={togglePlay} style={{ marginTop: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem'}}>
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
