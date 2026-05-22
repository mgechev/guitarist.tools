import { useState, useEffect, useRef } from 'react';
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
  const [feedbackKey, setFeedbackKey] = useState(0);
  
  // Dynamic default latency calculation based on AudioContext or fallback to 80ms
  const [latency, setLatency] = useState(() => {
    const stored = localStorage.getItem('rhythm_latency_compensation');
    if (stored) return parseInt(stored, 10);
    
    try {
      const ctx = getSharedAudioContext();
      const output = ctx.outputLatency || 0;
      const base = ctx.baseLatency || 0;
      const calculated = Math.round((output + base) * 1000);
      return calculated > 0 ? calculated : 80;
    } catch {
      return 80;
    }
  });

  const handleLatencyChange = (newLatency) => {
    setLatency(newLatency);
    localStorage.setItem('rhythm_latency_compensation', newLatency.toString());
  };
  
  const targetTimesRef = useRef([]);
  const feedbackTimeoutRef = useRef(null);
  const gridRef = useRef(null);
  const playStartTimeRef = useRef(0);
  const maxStreakRef = useRef(maxStreak);
  const lastProcessedAttackRef = useRef(0);

  useEffect(() => {
    maxStreakRef.current = maxStreak;
  }, [maxStreak]);

  const showFeedback = (text) => {
    setFeedback(text);
    setFeedbackKey(k => k + 1);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback('');
    }, 500);
  };

  // Configure metronome and start/stop
  const togglePlay = () => {
    if (isPlaying) {
      metronome.stop();
      setIsPlaying(false);
      setStreak(0);
      setFeedback('');
      targetTimesRef.current = [];
    } else {
      metronome.setTempo(tempo);
      // Downpicking needs 8th notes, Gallop needs 16th notes
      metronome.setSubdivision(mode === 'gallop' ? 4 : 2);
      
      // Intercept scheduled notes
      metronome.onScheduledNote = (noteInfo) => {
        const { time, tick } = noteInfo;
        
        const localTick = tick % 12;
        
        let isTarget = false;
        if (mode === 'downpicking') {
          // Beat (0) and 8th (&) (6)
          if (localTick === 0 || localTick === 6) isTarget = true;
        } else if (mode === 'gallop') {
          // Beat (0), 8th (&) (6), 16th (a) (9)
          if (localTick === 0 || localTick === 6 || localTick === 9) isTarget = true;
        }

        if (isTarget) {
          targetTimesRef.current.push({ time, hit: false, stepIndex: Math.floor(tick / 3) });
        }
      };

      // Reset attack time processing tracking to ignore older attacks
      lastProcessedAttackRef.current = activeAttackTime || 0;

      metronome.start();
      playStartTimeRef.current = getSharedAudioContext().currentTime + 0.05;
      setIsPlaying(true);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (isPlaying) {
      metronome.setSubdivision(newMode === 'gallop' ? 4 : 2);
      targetTimesRef.current = [];
      setStreak(0);
      setFeedback('');
    }
  };

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

    const latencySec = latency / 1000;
    const adjustedAttackTime = activeAttackTime - latencySec;

    // Skip if we've already processed this attack timestamp or if it's older than start time
    if (activeAttackTime <= lastProcessedAttackRef.current || adjustedAttackTime < playStartTimeRef.current) {
      return;
    }
    lastProcessedAttackRef.current = activeAttackTime;

    const targets = targetTimesRef.current;
    let closestIdx = -1;
    let minDiff = Infinity;

    for (let i = 0; i < targets.length; i++) {
      if (targets[i].hit) continue;
      const diff = Math.abs(targets[i].time - adjustedAttackTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (closestIdx !== -1) {
      const stepIdx = targets[closestIdx].stepIndex;
      const el = gridRef.current?.children[stepIdx];

      if (minDiff <= 0.06) { // 60ms window for PERFECT
        targets[closestIdx].hit = true;
        setTimeout(() => {
          showFeedback('PERFECT');
          if (el) {
            el.classList.remove(styles.stepHitPerfect, styles.stepHitGood);
            void el.offsetWidth;
            el.classList.add(styles.stepHitPerfect);
          }
          setStreak(s => {
            const newStreak = s + 1;
            if (newStreak > maxStreakRef.current) setMaxStreak(newStreak);
            return newStreak;
          });
        }, 0);
      } else if (minDiff <= 0.12) { // 120ms window for GOOD
        targets[closestIdx].hit = true;
        setTimeout(() => {
          showFeedback('GOOD');
          if (el) {
            el.classList.remove(styles.stepHitPerfect, styles.stepHitGood);
            void el.offsetWidth;
            el.classList.add(styles.stepHitGood);
          }
          setStreak(s => {
            const newStreak = s + 1;
            if (newStreak > maxStreakRef.current) setMaxStreak(newStreak);
            return newStreak;
          });
        }, 0);
      } else {
        // They attacked but it was completely off-beat
        setTimeout(() => {
          showFeedback('MISS');
          setStreak(0);
        }, 0);
      }
    } else {
      // No targets available but they attacked
      setTimeout(() => {
        showFeedback('MISS');
        setStreak(0);
      }, 0);
    }
  }, [activeAttackTime, isPlaying, latency]);

  // Loop to catch missed notes
  useEffect(() => {
    if (!isPlaying) return;
    
    const latencySec = latency / 1000;
    
    const interval = setInterval(() => {
      const now = getSharedAudioContext().currentTime;
      const targets = targetTimesRef.current;
      
      // Allow 0.12s grace period after note time (plus latency compensation) to hit it
      while (targets.length > 0 && targets[0].time < now - latencySec - 0.13) {
        const missedTarget = targets.shift();
        if (!missedTarget.hit) {
          showFeedback('MISS');
          setStreak(0);
        }
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, latency]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (metronome.isPlaying) {
        metronome.stop();
      }
    };
  }, []);

  // Animation Loop for the 16-step playhead
  useEffect(() => {
    if (!isPlaying) return;
    let animId;
    const stepDuration = (60 / tempo) / 4; // duration of one 16th note step in seconds

    const updatePlayhead = () => {
      const now = getSharedAudioContext().currentTime;
      let elapsed = now - playStartTimeRef.current;
      if (elapsed < 0) elapsed = 0;
      
      const currentStep = Math.floor(elapsed / stepDuration) % 16;
      
      if (gridRef.current) {
        const steps = gridRef.current.children;
        for (let i = 0; i < steps.length; i++) {
          if (i === currentStep) {
            steps[i].classList.add(styles.activeStep);
          } else {
            steps[i].classList.remove(styles.activeStep);
          }
        }
      }
      animId = requestAnimationFrame(updatePlayhead);
    };

    animId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, tempo]);

  const getTargetSteps = () => {
    const steps = [];
    for (let i = 0; i < 4; i++) { // 4 beats
      const base = i * 4;
      steps.push(base); // 1
      steps.push(base + 2); // &
      if (mode === 'gallop') {
        steps.push(base + 3); // a
      }
    }
    return steps;
  };
  const targetSteps = getTargetSteps();

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
            onClick={() => handleModeChange('downpicking')}
          >
            Downpicking (8ths)
          </button>
          <button 
            className={`${styles.modeBtn} ${mode === 'gallop' ? styles.active : ''}`}
            onClick={() => handleModeChange('gallop')}
          >
            Gallop (8th, 16th, 16th)
          </button>
        </div>

        <div className={styles.sequencerContainer}>
          <div className={styles.beatLabels}>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
          <div className={styles.sequencerGrid} ref={gridRef}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i} 
                className={`${styles.step} ${targetSteps.includes(i) ? styles.targetStep : ''}`} 
              />
            ))}
          </div>
        </div>

        <div className={styles.statsContainer} style={{ minHeight: '146px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {!isGuitarConnected ? (
            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>cable</span>
              <span>Connect guitar to track your streaks</span>
            </div>
          ) : (
            <>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Current Streak</span>
                <span className={styles.statValue}>{streak}</span>
              </div>
              
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className={styles.feedbackDisplay}>
                  {feedback === 'PERFECT' && <span key={`perfect-${feedbackKey}`} className={styles.feedbackPERFECT}>PERFECT</span>}
                  {feedback === 'GOOD' && <span key={`good-${feedbackKey}`} className={styles.feedbackGOOD}>GOOD</span>}
                  {feedback === 'MISS' && <span key={`miss-${feedbackKey}`} className={styles.feedbackMISS}>MISS</span>}
                </div>
              </div>

              <div className={styles.statBox}>
                <span className={styles.statLabel}>Best Streak</span>
                <span className={styles.statValue}>{maxStreak}</span>
              </div>
            </>
          )}
        </div>

        <div className={styles.controls}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            <div className={styles.tempoSlider}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span>Tempo</span>
                <span>{tempo} BPM</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="300" 
                value={tempo} 
                onChange={(e) => handleTempoChange(parseInt(e.target.value))}
              />
            </div>

            <div className={styles.tempoSlider}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span>Latency Compensation</span>
                <span>{latency} ms</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="300" 
                step="5"
                value={latency} 
                onChange={(e) => handleLatencyChange(parseInt(e.target.value))}
                title="Compensate for hardware, OS, and interface input/output delay."
              />
            </div>
          </div>

          <Button 
            onClick={togglePlay} 
            variant={isPlaying ? 'secondary' : 'primary'}
            style={{ minWidth: '200px', fontSize: '1.25rem', padding: '1rem' }}
          >
            {isPlaying ? 'Stop' : 'Start Practice'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RhythmMode;
