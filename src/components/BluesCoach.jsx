/* eslint-disable react-hooks/immutability, react-hooks/purity */
import { useState, useEffect, useRef } from 'react';
import { metronome } from '../utils/metronomeLogic';
import { getSharedAudioContext } from '../utils/audioContext';
import { NOTES, STRING_MIDI_ROOTS, getTabPosition } from '../utils/musicLogic';
import Button from './shared/Button';
import styles from './BluesCoach.module.css';

// Chords for 12-bar blues in 5 key options (standard dominant 7th chords)
const BLUES_KEYS_CHORDS = {
  'A': {
    I: { name: 'A7', notes: [45, 52, 55, 61], scale: [9, 0, 2, 3, 4, 7], chordTones: [9, 1, 4, 7] }, // Root A, C# (1), E (4), G (7)
    IV: { name: 'D7', notes: [38, 54, 57, 60], chordTones: [2, 6, 9, 0] }, // D, F# (6), A (9), C (0)
    V: { name: 'E7', notes: [40, 56, 59, 62], chordTones: [4, 8, 11, 2] } // E, G# (8), B (11), D (2)
  },
  'C': {
    I: { name: 'C7', notes: [36, 55, 58, 64], scale: [0, 3, 5, 6, 7, 10], chordTones: [0, 4, 7, 10] },
    IV: { name: 'F7', notes: [41, 57, 60, 63], chordTones: [5, 9, 0, 3] },
    V: { name: 'G7', notes: [43, 59, 62, 65], chordTones: [7, 11, 2, 5] }
  },
  'D': {
    I: { name: 'D7', notes: [38, 57, 60, 66], scale: [2, 5, 7, 8, 9, 0], chordTones: [2, 6, 9, 0] },
    IV: { name: 'G7', notes: [43, 59, 62, 65], chordTones: [7, 11, 2, 5] },
    V: { name: 'A7', notes: [45, 52, 55, 61], chordTones: [9, 1, 4, 7] }
  },
  'E': {
    I: { name: 'E7', notes: [40, 59, 62, 68], scale: [4, 7, 9, 10, 11, 2], chordTones: [4, 8, 11, 2] },
    IV: { name: 'A7', notes: [45, 52, 55, 61], chordTones: [9, 1, 4, 7] },
    V: { name: 'B7', notes: [47, 51, 54, 57], chordTones: [11, 3, 6, 9] }
  },
  'G': {
    I: { name: 'G7', notes: [43, 50, 53, 59], scale: [7, 10, 0, 1, 2, 5], chordTones: [7, 11, 2, 5] },
    IV: { name: 'C7', notes: [36, 55, 58, 64], chordTones: [0, 4, 7, 10] },
    V: { name: 'D7', notes: [38, 57, 60, 66], chordTones: [2, 6, 9, 0] }
  }
};

const PROGRESSION = [
  'I', 'I', 'I', 'I',      // Bars 1-4
  'IV', 'IV', 'I', 'I',    // Bars 5-8
  'V', 'IV', 'I', 'V'      // Bars 9-12 (Turnaround)
];

const STRUMMING_PATTERNS = {
  shuffle: {
    name: 'Shuffle Strum',
    description: 'Swing feel triplet eighth notes. Hit on beats and upbeat swings.',
    steps: ['⬇️', '', '⬆️', '⬇️', '', '⬆️', '⬇️', '', '⬆️', '⬇️', '', '⬆️'], // 12 subdivisions
    displaySteps: [
      { label: '1', dir: '⬇️', active: true },
      { label: 'trip', dir: '', active: false },
      { label: 'let', dir: '⬆️', active: true },
      { label: '2', dir: '⬇️', active: true },
      { label: 'trip', dir: '', active: false },
      { label: 'let', dir: '⬆️', active: true },
      { label: '3', dir: '⬇️', active: true },
      { label: 'trip', dir: '', active: false },
      { label: 'let', dir: '⬆️', active: true },
      { label: '4', dir: '⬇️', active: true },
      { label: 'trip', dir: '', active: false },
      { label: 'let', dir: '⬆️', active: true }
    ]
  },
  quarters: {
    name: 'Quarter Notes',
    description: 'Basic four-on-the-floor strumming. Focus on pure timing.',
    steps: ['⬇️', '', '', '⬇️', '', '', '⬇️', '', '', '⬇️', '', ''],
    displaySteps: [
      { label: '1', dir: '⬇️', active: true },
      { label: 'trip', dir: '', active: false },
      { label: 'let', dir: '', active: false },
      { label: '2', dir: '⬇️', active: true },
      { label: 'trip', dir: '', active: false },
      { label: 'let', dir: '', active: false },
      { label: '3', dir: '⬇️', active: true },
      { label: 'trip', dir: '', active: false },
      { label: 'let', dir: '', active: false },
      { label: '4', dir: '⬇️', active: true },
      { label: 'trip', dir: '', active: false },
      { label: 'let', dir: '', active: false }
    ]
  },
  slow: {
    name: 'Slow Blues',
    description: '12/8 time feel. Triplet strum on every subdivision beat.',
    steps: ['⬇️', '⬇️', '⬆️', '⬇️', '⬇️', '⬆️', '⬇️', '⬇️', '⬆️', '⬇️', '⬇️', '⬆️'],
    displaySteps: [
      { label: '1', dir: '⬇️', active: true },
      { label: 'trip', dir: '⬇️', active: true },
      { label: 'let', dir: '⬆️', active: true },
      { label: '2', dir: '⬇️', active: true },
      { label: 'trip', dir: '⬇️', active: true },
      { label: 'let', dir: '⬆️', active: true },
      { label: '3', dir: '⬇️', active: true },
      { label: 'trip', dir: '⬇️', active: true },
      { label: 'let', dir: '⬆️', active: true },
      { label: '4', dir: '⬇️', active: true },
      { label: 'trip', dir: '⬇️', active: true },
      { label: 'let', dir: '⬆️', active: true }
    ]
  }
};

const BluesCoach = ({ activePitchData, activeAttackTime, isGuitarConnected }) => {
  const [selectedKey, setSelectedKey] = useState('A');
  const [rhythmPattern, setRhythmPattern] = useState('shuffle'); // 'shuffle', 'quarters', 'slow'
  const [tempo, setTempo] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muteMetronomeClick, setMuteMetronomeClick] = useState(true);
  const [isLoopingChords, setIsLoopingChords] = useState(true);
  
  // Scoring / stats
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [successfulHits, setSuccessfulHits] = useState(0);
  const [strumHistory, setStrumHistory] = useState([]);

  // Metronome progression state
  const [currentBar, setCurrentBar] = useState(0);
  const [activeSubdivision, setActiveSubdivision] = useState(-1); // 0 to 11

  const currentBarRef = useRef(0);
  const lastTickRef = useRef(-1);
  const playStartTimeRef = useRef(0);
  const targetTimesRef = useRef([]);
  const feedbackTimeoutRef = useRef(null);
  const lastProcessedAttackRef = useRef(0);

  // Latency settings (shared from storage or dynamic default)
  const [latency, setLatency] = useState(() => {
    const stored = localStorage.getItem('rhythm_latency_compensation');
    if (stored) return parseInt(stored, 10);
    return 80;
  });

  const activeChord = PROGRESSION[currentBar];
  const activeChordName = BLUES_KEYS_CHORDS[selectedKey][activeChord].name;
  const activeBluesScale = BLUES_KEYS_CHORDS[selectedKey].I.scale;
  const activeChordTones = BLUES_KEYS_CHORDS[selectedKey][activeChord].chordTones;

  const showFeedback = (text) => {
    setFeedback(text);
    setFeedbackKey(k => k + 1);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback('');
    }, 500);
  };

  // Synth chord playing helper
  const playRhythmChordHit = (chordNotes, time, isDownbeat, duration = 0.2) => {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const dest = ctx.destination;

    chordNotes.forEach((midi, idx) => {
      const frequency = 440 * Math.pow(2, (midi - 69) / 12);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Organic organ/guitar mix synth using triangle waves
      osc.type = 'triangle';
      osc.frequency.value = frequency;

      // Simulate strum delay: downbeats low to high, upbeats high to low
      const strumDelay = isDownbeat ? idx * 0.015 : (chordNotes.length - 1 - idx) * 0.012;
      const hitTime = time + strumDelay;

      // Filter settings for a warm, pluck-like shape
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, hitTime);
      filter.frequency.exponentialRampToValueAtTime(320, hitTime + duration);

      const maxVolume = isDownbeat ? 0.06 : 0.035;

      gain.gain.setValueAtTime(0, hitTime);
      gain.gain.linearRampToValueAtTime(maxVolume, hitTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(hitTime);
      osc.stop(hitTime + duration + 0.1);
    });
  };

  // Toggle backing metronome
  const togglePlay = () => {
    if (isPlaying) {
      metronome.stop();
      setIsPlaying(false);
      setStreak(0);
      setFeedback('');
      setCurrentBar(0);
      setActiveSubdivision(-1);
      targetTimesRef.current = [];
      setStrumHistory([]);
      currentBarRef.current = 0;
      lastTickRef.current = -1;
    } else {
      metronome.setTempo(tempo);
      // Subdivision 3 schedules 3 ticks per beat (triplets = 12 subdivisions per bar)
      metronome.setSubdivision(3);
      metronome.volume = muteMetronomeClick ? 0 : 0.4;

      // Intercept ticks
      metronome.onScheduledNote = (noteInfo) => {
        const { time, tick } = noteInfo;
        
        // Actually, since subdivision = 3:
        // scheduleNote receives tick value.
        // Wait, what are the actual tick values passed when subdivision is 3?
        // Let's look at Metronome.scheduleNote:
        // const isTriplet = this.subdivision === 3 && (tick % 4) === 0;
        // So scheduleNote is only called when (tick % 4) === 0.
        // This means tick is always 0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44.
        // Let's map these tick values to subdivisions index (0 to 11):
        const subdivisionIndex = Math.round(tick / 4);

        // 1. Detect wrap around
        if (tick < lastTickRef.current) {
          currentBarRef.current = (currentBarRef.current + 1) % 12;
        }
        lastTickRef.current = tick;

        // Sync visual UI state
        // Wrapped in setTimeout to avoid React render batching warnings
        setTimeout(() => {
          setCurrentBar(currentBarRef.current);
          setActiveSubdivision(subdivisionIndex);
        }, 0);

        // 2. Play backing loop chords
        const chordInfo = BLUES_KEYS_CHORDS[selectedKey][PROGRESSION[currentBarRef.current]];
        const patternDef = STRUMMING_PATTERNS[rhythmPattern];
        const strumInstruction = patternDef.steps[subdivisionIndex];
        
        const isStrumTick = strumInstruction !== '';
        const isDownbeat = strumInstruction === '⬇️';

        if (isStrumTick) {
          if (isLoopingChords) {
            const hitDuration = isDownbeat ? 0.22 : 0.12;
            playRhythmChordHit(chordInfo.notes, time, isDownbeat, hitDuration);
          }

          // Register target strum for verification
          targetTimesRef.current.push({
            time,
            hit: false,
            bar: currentBarRef.current,
            subdivisionIndex,
            isDownbeat
          });
        }
      };

      // Set refs
      lastProcessedAttackRef.current = activeAttackTime || 0;
      playStartTimeRef.current = getSharedAudioContext().currentTime + 0.05;
      setIsPlaying(true);
      
      metronome.start();
    }
  };

  // Handle dynamic parameters
  const handleKeyChange = (key) => {
    setSelectedKey(key);
    if (isPlaying) {
      targetTimesRef.current = [];
      setStrumHistory([]);
    }
  };

  const pickRandomKey = () => {
    const keys = Object.keys(BLUES_KEYS_CHORDS);
    const filtered = keys.filter(k => k !== selectedKey);
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    handleKeyChange(random);
    showFeedback(`KEY OF ${random}`);
  };

  const handlePatternChange = (pat) => {
    setRhythmPattern(pat);
    if (isPlaying) {
      targetTimesRef.current = [];
      setStrumHistory([]);
      setStreak(0);
    }
  };

  const handleTempoChange = (val) => {
    setTempo(val);
    if (isPlaying) {
      metronome.setTempo(val);
    }
  };

  // Mute click toggle
  const toggleMuteClick = () => {
    setMuteMetronomeClick(!muteMetronomeClick);
    metronome.volume = !muteMetronomeClick ? 0 : 0.4;
  };

  // Process guitar attacks (verification engine)
  useEffect(() => {
    if (!activeAttackTime || !isPlaying) return;

    const latencySec = latency / 1000;
    const adjustedAttack = activeAttackTime - latencySec;

    // Filter out old inputs
    if (activeAttackTime <= lastProcessedAttackRef.current || adjustedAttack < playStartTimeRef.current) {
      return;
    }
    lastProcessedAttackRef.current = activeAttackTime;

    const targets = targetTimesRef.current;
    let closestIdx = -1;
    let minDiff = Infinity;

    for (let i = 0; i < targets.length; i++) {
      if (targets[i].hit) continue;
      const diff = Math.abs(targets[i].time - adjustedAttack);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (closestIdx !== -1) {
      const target = targets[closestIdx];
      const targetSubdivision = target.subdivisionIndex;
      const targetBar = target.bar;
      const rawOffsetSec = activeAttackTime - target.time;
      const compensatedOffsetSec = adjustedAttack - target.time;
      const rawOffsetMs = Math.round(rawOffsetSec * 1000);
      const compensatedOffsetMs = Math.round(compensatedOffsetSec * 1000);

      setTotalAttempts(a => a + 1);

      let grade = 'MISS';
      if (minDiff <= 0.06) { // 60ms PERFECT
        target.hit = true;
        setSuccessfulHits(h => h + 1);
        showFeedback('PERFECT');
        grade = 'PERFECT';
        setStreak(s => {
          const next = s + 1;
          if (next > maxStreak) setMaxStreak(next);
          return next;
        });
      } else if (minDiff <= 0.12) { // 120ms GOOD
        target.hit = true;
        setSuccessfulHits(h => h + 1);
        showFeedback('GOOD');
        grade = 'GOOD';
        setStreak(s => {
          const next = s + 1;
          if (next > maxStreak) setMaxStreak(next);
          return next;
        });
      } else {
        // Offbeat
        showFeedback('MISS');
        grade = 'MISS';
        setStreak(0);
      }

      setStrumHistory(prev => [
        {
          id: Date.now() + Math.random(),
          rawOffsetMs,
          compensatedOffsetMs,
          grade,
          subdivisionIndex: targetSubdivision,
          bar: targetBar
        },
        ...prev.slice(0, 15)
      ]);
    }
  }, [activeAttackTime, isPlaying, latency, maxStreak]);

  // Clean up missed targets
  useEffect(() => {
    if (!isPlaying) return;

    const latencySec = latency / 1000;

    const interval = setInterval(() => {
      const now = getSharedAudioContext().currentTime;
      const targets = targetTimesRef.current;

      while (targets.length > 0 && targets[0].time < now - latencySec - 0.13) {
        const missed = targets.shift();
        if (!missed.hit) {
          setTotalAttempts(a => a + 1);
          showFeedback('MISS');
          setStreak(0);
          const missedSubdivision = missed.subdivisionIndex;
          const missedBar = missed.bar;
          setStrumHistory(prev => [
            {
              id: Date.now() + Math.random(),
              rawOffsetMs: null,
              compensatedOffsetMs: null,
              grade: 'MISS_SILENT',
              subdivisionIndex: missedSubdivision,
              bar: missedBar
            },
            ...prev.slice(0, 15)
          ]);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, latency]);

  // Clean up metronome on unmount
  useEffect(() => {
    return () => {
      if (metronome.isPlaying) {
        metronome.stop();
      }
    };
  }, []);

  // Compute live pitch coordinate
  let liveNoteCoordinate = null;
  if (activePitchData) {
    liveNoteCoordinate = getTabPosition(activePitchData.midiNote);
  }

  // Draw fretboard scale note
  const getNoteStyleClass = (noteIndex) => {
    const isRoot = noteIndex === NOTES.indexOf(selectedKey);
    const isBlueNote = noteIndex === (NOTES.indexOf(selectedKey) + 6) % 12;
    const isChordTone = activeChordTones.includes(noteIndex);

    let classes = [styles.noteBubble];
    if (isRoot) classes.push(styles.rootNote);
    else if (isBlueNote) classes.push(styles.blueNote);
    else classes.push(styles.scaleNote);

    if (isChordTone) classes.push(styles.chordToneHighlight);

    return {
      className: classes.join(' '),
      label: isRoot ? selectedKey : (isBlueNote ? 'b5' : NOTES[noteIndex]),
      isRoot,
      isBlueNote,
      isChordTone
    };
  };

  const getAccuracy = () => {
    if (totalAttempts === 0) return 0;
    return Math.round((successfulHits / totalAttempts) * 100);
  };

  return (
    <div className={styles.bluesCoachContainer}>
      {/* 1. Header Information Dashboard */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className={styles.coachHeader}>
          <h2>Blues Improvisation Coach</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Master 12-bar blues timing, strumming patterns, and chord change soloing.</p>
        </div>

        <div className={styles.topControlRow}>
          <div className={styles.optionBox}>
            <span className={styles.optionLabel}>Blues Key</span>
            <div className={styles.keyButtonGroup}>
              {Object.keys(BLUES_KEYS_CHORDS).map(key => (
                <button
                  key={key}
                  className={`${styles.keyBtn} ${selectedKey === key ? styles.activeKey : ''}`}
                  onClick={() => handleKeyChange(key)}
                  disabled={isPlaying}
                >
                  {key}
                </button>
              ))}
              <button className={styles.randomKeyBtn} onClick={pickRandomKey}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>casino</span>
                <span>Random</span>
              </button>
            </div>
          </div>

          <div className={styles.optionBox}>
            <span className={styles.optionLabel}>Strumming Rhythm</span>
            <div className={styles.rhythmSelectGroup}>
              {Object.keys(STRUMMING_PATTERNS).map(patternKey => (
                <button
                  key={patternKey}
                  className={`${styles.rhythmBtn} ${rhythmPattern === patternKey ? styles.activeRhythm : ''}`}
                  onClick={() => handlePatternChange(patternKey)}
                >
                  {STRUMMING_PATTERNS[patternKey].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className={styles.patternDescription}>{STRUMMING_PATTERNS[rhythmPattern].description}</p>
      </div>

      {/* 2. 12-Bar Progression Tracker */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3>12-Bar Chord Progression Matrix</h3>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)' }}>
            <div>Active Chord: <strong style={{ color: 'var(--text-primary)' }}>{activeChordName} ({activeChord})</strong></div>
            <div>Bar: <strong style={{ color: 'var(--text-primary)' }}>{isPlaying ? currentBar + 1 : '-'} / 12</strong></div>
          </div>
        </div>

        <div className={styles.progressionMatrix}>
          {PROGRESSION.map((chordDegree, idx) => {
            const chordInfo = BLUES_KEYS_CHORDS[selectedKey][chordDegree];
            const isActive = isPlaying && currentBar === idx;
            
            return (
              <div 
                key={idx} 
                className={`${styles.progressionBar} ${isActive ? styles.activeProgressionBar : ''}`}
              >
                <span className={styles.barNumber}>{idx + 1}</span>
                <span className={styles.chordDegreeLabel}>{chordDegree}</span>
                <span className={styles.chordNameLabel}>{chordInfo.name}</span>
                {isActive && (
                  <div className={styles.visualBarProgress}>
                    <div 
                      className={styles.barProgressFill} 
                      style={{ width: `${((activeSubdivision + 1) / 12) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Strum Sequencer and Real-time Verification */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Strumming Verification Grid</h3>
          <div className={styles.accuracyMeter}>
            Accuracy: <strong style={{ color: getAccuracy() > 75 ? '#88ff5a' : getAccuracy() > 40 ? '#fcff42' : '#ff5e7e' }}>{getAccuracy()}%</strong>
          </div>
        </div>

        <div className={styles.sequencerContainer}>
          <div className={styles.sequencerGrid}>
            {STRUMMING_PATTERNS[rhythmPattern].displaySteps.map((step, idx) => {
              const isActiveSub = activeSubdivision === idx;
              const hasStrum = step.active;
              const userStrum = strumHistory.find(h => h.bar === currentBar && h.subdivisionIndex === idx);
              
              return (
                <div 
                  key={idx}
                  className={`
                    ${styles.sequencerStep} 
                    ${isActiveSub ? styles.activeSeqStep : ''} 
                    ${hasStrum ? styles.targetSeqStep : ''}
                  `}
                >
                  <span className={styles.seqLabel}>{step.label}</span>
                  {hasStrum && <span className={styles.seqArrow}>{step.dir}</span>}
                  
                  {/* User Hit timing indicator */}
                  {userStrum && (
                    <div 
                      className={`
                        ${styles.userStrumMarker} 
                        ${styles['userStrum_' + userStrum.grade]}
                      `}
                    >
                      {userStrum.compensatedOffsetMs !== null ? (
                        <span>{userStrum.compensatedOffsetMs > 0 ? '+' : ''}{userStrum.compensatedOffsetMs}ms</span>
                      ) : (
                        <span style={{ fontSize: '0.6rem' }}>MISS</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.statsPanel}>
          <div className={styles.statCell}>
            <span className={styles.statCellLabel}>Streak</span>
            <span className={styles.statCellVal}>{streak}</span>
          </div>

          <div className={styles.feedbackDisplay}>
            {feedback === 'PERFECT' && <span key={`perfect-${feedbackKey}`} className={styles.feedbackPERFECT}>PERFECT</span>}
            {feedback === 'GOOD' && <span key={`good-${feedbackKey}`} className={styles.feedbackGOOD}>GOOD</span>}
            {feedback === 'MISS' && <span key={`miss-${feedbackKey}`} className={styles.feedbackMISS}>MISS</span>}
          </div>

          <div className={styles.statCell}>
            <span className={styles.statCellLabel}>Max Streak</span>
            <span className={styles.statCellVal}>{maxStreak}</span>
          </div>
        </div>

        {/* Real-time Timing Deviation Meter */}
        <div className={styles.deviationMeterContainer}>
          <div className={styles.deviationMeterHeader}>
            <span>Timing Deviation (Compensated)</span>
            {strumHistory.length > 0 && strumHistory[0].compensatedOffsetMs !== null ? (
              <span className={
                strumHistory[0].grade === 'PERFECT' ? styles.textPerfect :
                strumHistory[0].grade === 'GOOD' ? styles.textGood : styles.textMiss
              }>
                {strumHistory[0].compensatedOffsetMs > 0 ? '+' : ''}{strumHistory[0].compensatedOffsetMs} ms ({strumHistory[0].grade})
              </span>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>Awaiting first strum...</span>
            )}
          </div>
          
          <div className={styles.deviationBar}>
            <div className={styles.deviationZoneGood} />
            <div className={styles.deviationZonePerfect} />
            <div className={styles.deviationCenterLine} />
            
            {/* Pointer needle */}
            {strumHistory.length > 0 && strumHistory[0].compensatedOffsetMs !== null && (
              <div 
                className={styles.deviationPointer} 
                style={{ 
                  left: `${Math.min(100, Math.max(0, 50 + (strumHistory[0].compensatedOffsetMs / 300) * 100))}%` 
                }} 
              />
            )}
          </div>
          
          <div className={styles.deviationLabels}>
            <span>-150ms (Too Early)</span>
            <span>On Time</span>
            <span>+150ms (Too Late)</span>
          </div>

          <p className={styles.calibrationTip}>
            {strumHistory.length > 0 && strumHistory[0].compensatedOffsetMs !== null ? (
              strumHistory[0].compensatedOffsetMs > 30 ? (
                <>💡 Your hits are landing <strong>late</strong>. Try increasing the <strong>Latency Compensation</strong> slider below.</>
              ) : strumHistory[0].compensatedOffsetMs < -30 ? (
                <>💡 Your hits are landing <strong>early</strong>. Try decreasing the <strong>Latency Compensation</strong> slider below.</>
              ) : (
                <>🎉 Excellent timing! Your hits are well-aligned with the backing track.</>
              )
            ) : (
              <>💡 Connect your guitar, start the backing track, and strum along to see timing deviation and calibrate latency.</>
            )}
          </p>
        </div>

        <div className={styles.rhythmDashboardControls}>
          <div className={styles.tempoControl}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span>Practice Tempo</span>
              <span>{tempo} BPM</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="200" 
              value={tempo} 
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
            />
          </div>

          <div className={styles.backingTrackControls}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className={styles.checkboxLabel} title="Play the synth rhythm section chords in sync.">
                <input 
                  type="checkbox" 
                  checked={isLoopingChords} 
                  onChange={(e) => setIsLoopingChords(e.target.checked)} 
                />
                <span>Synthesize Backing Chords</span>
              </label>
              
              <label className={styles.checkboxLabel} title="Play the metronome click sound.">
                <input 
                  type="checkbox" 
                  checked={!muteMetronomeClick} 
                  onChange={toggleMuteClick} 
                />
                <span>Hear Metronome Click</span>
              </label>
            </div>

            <Button 
              onClick={togglePlay} 
              variant={isPlaying ? 'secondary' : 'primary'}
              style={{ minWidth: '180px' }}
            >
              {isPlaying ? 'Stop Backing' : 'Start Backing'}
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Blues Scale Visual Improvisation neck */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h3>Blues Scale & Chord Tones Fretboard</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Practice soloing on top of the progression. 
              Roots are <span style={{ color: '#ffb938', fontWeight: 600 }}>gold</span>, 
              the Blues Note (b5) is <span style={{ color: '#00ccff', fontWeight: 600 }}>blue</span>, 
              and chord tones for the active chord <span style={{ textDecoration: 'underline' }}>glow neon cyan</span>.
            </p>
          </div>
          {isGuitarConnected && activePitchData && (
            <div className={styles.liveDetectedNote}>
              Note: <strong>{NOTES[activePitchData.midiNote % 12]}</strong>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={styles.fretboardLegend}>
          <div className={styles.legendItem}><span className={`${styles.legendIcon} ${styles.rootNote}`} /> Root</div>
          <div className={styles.legendItem}><span className={`${styles.legendIcon} ${styles.blueNote}`} /> Blues Note (b5)</div>
          <div className={styles.legendItem}><span className={`${styles.legendIcon} ${styles.scaleNote}`} /> Blues Scale Notes</div>
          <div className={styles.legendItem}><span className={`${styles.legendIcon} ${styles.chordToneHighlightLegend}`} /> Active Chord Tones ({activeChordName})</div>
        </div>

        {/* Responsive Fretboard Visualizer */}
        <div className={styles.fretboardWrapper}>
          <div className={styles.fretboard}>
            {/* Draw Frets (Vertical bars) */}
            {Array.from({ length: 16 }).map((_, f) => (
              <div 
                key={f} 
                className={`${styles.fretWire} ${f === 0 ? styles.nutWire : ''}`}
                style={{ left: `${(f / 15) * 100}%` }}
              >
                <span className={styles.fretNumberLabel}>{f}</span>
                {/* Fret marker dots on standard positions (3, 5, 7, 9, 12, 15) */}
                {[3, 5, 7, 9, 12, 15].includes(f) && (
                  <div className={styles.fretDot} />
                )}
                {/* Double dot on 12th fret */}
                {f === 12 && (
                  <div className={styles.fretDotDouble} />
                )}
              </div>
            ))}

            {/* Draw Strings (Horizontal bars) */}
            {Array.from({ length: 6 }).map((_, s) => {
              const stringIndex = 5 - s; // 0 is high E (bottom), 5 is low E (top)
              
              return (
                <div key={s} className={styles.stringLine}>
                  {/* Note marker points */}
                  {Array.from({ length: 16 }).map((_, f) => {
                    const midiNote = STRING_MIDI_ROOTS[stringIndex] + f;
                    const noteIndex = midiNote % 12;
                    const isInScale = activeBluesScale.includes(noteIndex);
                    
                    const spec = getNoteStyleClass(noteIndex);
                    const isLivePlaying = liveNoteCoordinate && 
                                          liveNoteCoordinate.stringIndex === stringIndex && 
                                          liveNoteCoordinate.fret === f;
                    
                    return (
                      <div 
                        key={f} 
                        className={styles.fretCell}
                        style={{ left: `${((f + 0.5) / 15) * 100}%` }}
                      >
                        {isInScale && (
                          <div className={spec.className} title={`${NOTES[noteIndex]} (Fret ${f})`}>
                            {spec.label}
                          </div>
                        )}
                        {/* Live detected note cursor overlay */}
                        {isLivePlaying && (
                          <div className={styles.livePlayingPulse} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Latency compensation fine tuning */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ maxWidth: '400px' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>System Latency Compensation</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Adjust if strum timing misses despite playing in tempo. Compensates for audio devices.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '300px' }}>
          <input 
            type="range" 
            min="0" 
            max="300" 
            step="5"
            value={latency} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setLatency(val);
              localStorage.setItem('rhythm_latency_compensation', val.toString());
            }}
            style={{ flex: 1 }}
          />
          <span style={{ fontWeight: 600, width: '60px', textAlign: 'right' }}>{latency} ms</span>
        </div>
      </div>
    </div>
  );
};

export default BluesCoach;
