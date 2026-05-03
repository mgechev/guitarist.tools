import React, { useState, useEffect, useRef } from 'react';
import { metronome } from '../utils/metronomeLogic';
import { getSharedAudioContext } from '../utils/audioContext';
import Button from './shared/Button';
import styles from './RhythmMode.module.css';

const RhythmMode = ({ activeAttackTime, isGuitarConnected }) => {
  const [mode, setMode] = useState('downpicking'); // 'downpicking' or 'gallop'
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState(''); // 'PERFECT', 'GOOD', 'MISS'
  
  const targetTimesRef = useRef([]);
  const feedbackTimeoutRef = useRef(null);

  // Configure metronome and start/stop
  const togglePlay = () => {
    if (isPlaying) {
      metronome.stop();
      setIsPlaying(false);
      setStreak(0);
      setFeedback('');
      targetTimesRef.current = [];
    } else {
      if (!isGuitarConnected) {
        alert("Please connect your guitar using the tools menu first!");
        return;
      }
      
      metronome.setTempo(tempo);
      // Downpicking needs 8th notes, Gallop needs 16th notes
      metronome.setSubdivision(mode === 'gallop' ? 4 : 2);
      
      // Intercept scheduled notes
      metronome.onScheduledNote = (noteInfo) => {
        const { time, tick } = noteInfo;
        
        let isTarget = false;
        if (mode === 'downpicking') {
          // Beat (0) and 8th (&) (6)
          if (tick === 0 || tick === 6) isTarget = true;
        } else if (mode === 'gallop') {
          // Beat (0), 8th (&) (6), 16th (a) (9)
          if (tick === 0 || tick === 6 || tick === 9) isTarget = true;
        }

        if (isTarget) {
          targetTimesRef.current.push({ time, hit: false });
        }
      };

      metronome.start();
      setIsPlaying(true);
    }
  };

  // Change mode restarts tracking if playing
  useEffect(() => {
    if (isPlaying) {
      metronome.setSubdivision(mode === 'gallop' ? 4 : 2);
      targetTimesRef.current = [];
      setStreak(0);
      setFeedback('');
    }
  }, [mode]);

  // Tempo changes
  const handleTempoChange = (newTempo) => {
    setTempo(newTempo);
    if (isPlaying) {
      metronome.setTempo(newTempo);
    }
  };

  // Process attacks
  useEffect(() => {
    if (!activeAttackTime || !isPlaying) return;

    const targets = targetTimesRef.current;
    let closestIdx = -1;
    let minDiff = Infinity;

    for (let i = 0; i < targets.length; i++) {
      if (targets[i].hit) continue;
      const diff = Math.abs(targets[i].time - activeAttackTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (closestIdx !== -1) {
      if (minDiff <= 0.06) { // 60ms window for PERFECT
        targets[closestIdx].hit = true;
        showFeedback('PERFECT');
        setStreak(s => {
          const newStreak = s + 1;
          if (newStreak > maxStreak) setMaxStreak(newStreak);
          return newStreak;
        });
      } else if (minDiff <= 0.12) { // 120ms window for GOOD
        targets[closestIdx].hit = true;
        showFeedback('GOOD');
        setStreak(s => {
          const newStreak = s + 1;
          if (newStreak > maxStreak) setMaxStreak(newStreak);
          return newStreak;
        });
      }
      // If minDiff > 0.12, they attacked too early or completely off-beat.
      // We will let the missing loop catch it, or we could mark as MISS immediately if it's super close but outside 0.12.
    }
  }, [activeAttackTime, isPlaying]);

  // Loop to catch missed notes
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      const now = getSharedAudioContext().currentTime;
      const targets = targetTimesRef.current;
      
      // Allow 0.12s grace period after note time to hit it
      while (targets.length > 0 && targets[0].time < now - 0.13) {
        const missedTarget = targets.shift();
        if (!missedTarget.hit) {
          showFeedback('MISS');
          setStreak(0);
        }
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const showFeedback = (text) => {
    setFeedback(text);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback('');
    }, 500);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (metronome.isPlaying) {
        metronome.stop();
      }
    };
  }, []);

  return (
    <div className={styles.rhythmMode}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className={styles.rhythmHeader}>
          <h2>Rhythm Practice</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Master your right-hand timing and stamina</p>
        </div>

        <div className={styles.modeSelector}>
          <button 
            className={`${styles.modeBtn} ${mode === 'downpicking' ? styles.active : ''}`}
            onClick={() => setMode('downpicking')}
          >
            Downpicking (8ths)
          </button>
          <button 
            className={`${styles.modeBtn} ${mode === 'gallop' ? styles.active : ''}`}
            onClick={() => setMode('gallop')}
          >
            Gallop (8th, 16th, 16th)
          </button>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Current Streak</span>
            <span className={styles.statValue}>{streak}</span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.feedbackDisplay}>
              {feedback === 'PERFECT' && <span key={Date.now()} className={styles.feedbackPERFECT}>PERFECT</span>}
              {feedback === 'GOOD' && <span key={Date.now()} className={styles.feedbackGOOD}>GOOD</span>}
              {feedback === 'MISS' && <span key={Date.now()} className={styles.feedbackMISS}>MISS</span>}
            </div>
          </div>

          <div className={styles.statBox}>
            <span className={styles.statLabel}>Best Streak</span>
            <span className={styles.statValue}>{maxStreak}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.tempoSlider}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span>Tempo</span>
              <span>{tempo} BPM</span>
            </div>
            <input 
              type="range" 
              min="60" 
              max="240" 
              value={tempo} 
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
            />
          </div>

          <Button 
            onClick={togglePlay} 
            variant={isPlaying ? 'secondary' : 'primary'}
            style={{ minWidth: '200px', fontSize: '1.25rem', padding: '1rem' }}
          >
            {isPlaying ? 'Stop' : 'Start Practice'}
          </Button>
          {!isGuitarConnected && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Requires audio connection via the Tools menu (+)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RhythmMode;
