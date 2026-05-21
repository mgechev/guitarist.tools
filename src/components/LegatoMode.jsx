import { useState, useEffect, useRef } from 'react';
import { getSharedAudioContext } from '../utils/audioContext';
import { NOTES } from '../utils/musicLogic';
import Button from './shared/Button';
import styles from './LegatoMode.module.css';

const EXERCISES = [
  {
    id: 'hammer-on',
    name: 'Hammer-On Drill',
    description: 'Pluck the first note cleanly, then press your fretting finger down hard on a higher fret to trigger the second note. Do not pluck the second note.',
    steps: [
      { type: 'pick', label: '1. PLUCK', instruction: 'Pluck any note' },
      { type: 'legato', label: '2. HAMMER-ON', direction: 'up', instruction: 'Hammer-on to a HIGHER note' }
    ]
  },
  {
    id: 'pull-off',
    name: 'Pull-Off Drill',
    description: 'Pluck the first note cleanly, then pull your fretting finger off to sound a lower fretted or open note. Do not pluck the second note.',
    steps: [
      { type: 'pick', label: '1. PLUCK', instruction: 'Pluck any note' },
      { type: 'legato', label: '2. PULL-OFF', direction: 'down', instruction: 'Pull-off to a LOWER note' }
    ]
  },
  {
    id: 'trill',
    name: 'Trill Master',
    description: 'Pluck the first note, then alternate rapidly between a higher and lower note using only hammer-ons and pull-offs in a continuous sequence.',
    steps: [
      { type: 'pick', label: '1. PLUCK', instruction: 'Pluck the starting note' },
      { type: 'legato', label: '2. HAMMER', direction: 'up', instruction: 'Hammer-on up' },
      { type: 'legato', label: '3. PULL', direction: 'down', instruction: 'Pull-off down' },
      { type: 'legato', label: '4. HAMMER', direction: 'up', instruction: 'Hammer-on up' }
    ]
  }
];

const LegatoMode = ({ activePitchData, activeAttackTime, activeAudioData, isGuitarConnected }) => {
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const exercise = EXERCISES[activeExerciseIndex];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('Play the first note to begin.');
  const [feedbackType, setFeedbackType] = useState('info'); // 'info', 'success', 'warning', 'error'
  const [stepStates, setStepStates] = useState(new Array(exercise.steps.length).fill('idle')); // 'idle', 'success', 'failed'
  
  const [successCount, setSuccessCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  const prevMidiRef = useRef(null);
  const consecutiveNoteRef = useRef({ note: null, count: 0 });
  const nullFramesCountRef = useRef(0);

  // Audio Context for success beeps
  const playStepBeep = (isComplete) => {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    
    if (isComplete) {
      // Completed full exercise: High success arpeggio
      const freqs = [587.33, 880]; // D5, A5
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        const noteStart = now + idx * 0.08;
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.08, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });
    } else {
      // Completed single step: short positive beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 659.25; // E5
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  };

  // Calculate real-time signal volume (RMS)
  let rms = 0;
  if (activeAudioData) {
    let sumSquares = 0;
    const len = Math.min(activeAudioData.length, 256);
    for (let i = 0; i < len; i++) {
      const val = activeAudioData[i] / 255;
      sumSquares += val * val;
    }
    rms = Math.sqrt(sumSquares / len);
  }

  // Monitor pitch and transitions
  useEffect(() => {
    if (!isGuitarConnected) {
      consecutiveNoteRef.current = { note: null, count: 0 };
      nullFramesCountRef.current = 0;
      return;
    }

    if (!activePitchData) {
      nullFramesCountRef.current += 1;
      if (nullFramesCountRef.current > 2) {
        consecutiveNoteRef.current = { note: null, count: 0 };
      }
      return;
    }

    nullFramesCountRef.current = 0;
    const midiNote = activePitchData.midiNote;

    // Debounce pitch reading to filter transients
    if (consecutiveNoteRef.current.note === midiNote) {
      consecutiveNoteRef.current.count += 1;
    } else {
      consecutiveNoteRef.current = { note: midiNote, count: 1 };
    }

    if (consecutiveNoteRef.current.count < 2) {
      return; // Wait for stable pitch frame
    }

    const prevMidi = prevMidiRef.current;
    
    // Trigger logic ONLY on note change transitions
    if (prevMidi !== null && midiNote !== prevMidi) {
      const audioContext = getSharedAudioContext();
      if (!audioContext) return;
      
      const now = audioContext.currentTime;
      // Calculate delay since last picking attack transient
      const attackDelay = activeAttackTime ? (now - activeAttackTime) : Infinity;
      
      // Determine transition type:
      // If attack happened within 130ms of note change, it is considered PICKED.
      // Otherwise, it is a SLURRED (Legato) transition.
      const isPickedTransition = attackDelay < 0.13;
      
      const targetStep = exercise.steps[currentStep];
      
      if (targetStep) {
        // Wrap React state changes in setTimeout to avoid cascading render lint errors
        setTimeout(() => {
          if (targetStep.type === 'pick') {
            // Expecting a picked starting note
            if (isPickedTransition) {
              // Success: starting note picked correctly
              setStepStates(prev => {
                const nextStates = [...prev];
                nextStates[currentStep] = 'success';
                return nextStates;
              });
              setFeedbackMsg('Good pick! Now perform the legato transition...');
              setFeedbackType('success');
              playStepBeep(false);
              setCurrentStep(prev => prev + 1);
            } else {
              // User hammered starting note
              setFeedbackMsg('First note should be plucked to start the legato run.');
              setFeedbackType('warning');
            }
          } else if (targetStep.type === 'legato') {
            // Expecting slurred hammer-on or pull-off
            if (isPickedTransition) {
              // Failed: user plucked the note instead of hammering/pulling
              setStepStates(() => {
                const nextStates = new Array(exercise.steps.length).fill('idle');
                nextStates[currentStep] = 'failed';
                return nextStates;
              });
              setFeedbackMsg('Picked! Try to hammer-on/pull-off without picking the string.');
              setFeedbackType('error');
              setAttemptCount(prev => prev + 1);
              setCurrentStep(0); // Reset exercise
            } else {
              // Check pitch direction
              const directionCorrect = targetStep.direction === 'up' 
                ? midiNote > prevMidi 
                : midiNote < prevMidi;

              if (directionCorrect) {
                setStepStates(prev => {
                  const nextStates = [...prev];
                  nextStates[currentStep] = 'success';
                  return nextStates;
                });

                if (currentStep === exercise.steps.length - 1) {
                  // Completed full sequence!
                  setFeedbackMsg('Perfect Legato! Dynamic slur executed successfully.');
                  setFeedbackType('success');
                  setSuccessCount(prev => prev + 1);
                  setAttemptCount(prev => prev + 1);
                  playStepBeep(true);
                  setCurrentStep(0); // Restart drill
                } else {
                  // Advance to next legato step (for trills)
                  setFeedbackMsg('Nice slur! Keep the trill going...');
                  setFeedbackType('success');
                  playStepBeep(false);
                  setCurrentStep(prev => prev + 1);
                }
              } else {
                // Wrong direction
                setStepStates(() => {
                  const nextStates = new Array(exercise.steps.length).fill('idle');
                  nextStates[currentStep] = 'failed';
                  return nextStates;
                });
                setFeedbackMsg(targetStep.direction === 'up' 
                  ? 'Incorrect! Hammer-on should transition to a HIGHER note.' 
                  : 'Incorrect! Pull-off should transition to a LOWER note.'
                );
                setFeedbackType('error');
                setAttemptCount(prev => prev + 1);
                setCurrentStep(0);
              }
            }
          }
        }, 0);
      }
    }

    prevMidiRef.current = midiNote;
  }, [activePitchData, activeAttackTime, currentStep, isGuitarConnected, exercise]);

  const activeNoteName = activePitchData ? NOTES[activePitchData.midiNote % 12] : '-';

  return (
    <div className={styles.legatoLayout}>
      <div className={styles.leftCol}>
        <div className={`glass-panel ${styles.infoPanel}`}>
          <h2>Legato Trainer</h2>
          <p className={styles.subtext}>Master smooth note connections, hammer-ons, and pull-offs by training your fretting hand strength and coordination.</p>
          
          <div className={styles.exerciseSelector}>
            <h3>Select Exercise</h3>
            <div className={styles.exerciseList}>
              {EXERCISES.map((ex, idx) => (
                <button 
                  key={ex.id}
                  className={`${styles.exerciseCard} ${activeExerciseIndex === idx ? styles.activeCard : ''}`}
                  onClick={() => {
                    setActiveExerciseIndex(idx);
                    setCurrentStep(0);
                    setFeedbackMsg('Play the first note to begin.');
                    setFeedbackType('info');
                    setStepStates(new Array(ex.steps.length).fill('idle'));
                    prevMidiRef.current = null;
                    consecutiveNoteRef.current = { note: null, count: 0 };
                  }}
                >
                  <div className={styles.exerciseCardHeader}>
                    <span className="material-symbols-outlined">
                      {ex.id === 'hammer-on' ? 'keyboard_double_arrow_up' : ex.id === 'pull-off' ? 'keyboard_double_arrow_down' : 'sync'}
                    </span>
                    <h4>{ex.name}</h4>
                  </div>
                  <p>{ex.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightCol}>
        <div className={`glass-panel ${styles.dashboardPanel}`}>
          <div className={styles.headerRow}>
            <h3>Active Workout</h3>
            <div className={styles.statsContainer}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Success</span>
                <span className={styles.statVal}>{successCount}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Total</span>
                <span className={styles.statVal}>{attemptCount}</span>
              </div>
              <Button variant="secondary" onClick={() => { setSuccessCount(0); setAttemptCount(0); }}>
                Reset
              </Button>
            </div>
          </div>

          <div className={styles.trainerConsole}>
            {/* Note Display Bubble */}
            <div className={styles.noteDisplay}>
              <span className={styles.pitchName}>{activeNoteName}</span>
              <span className={styles.pitchDetails}>
                {activePitchData ? `${Math.round(activePitchData.frequency)} Hz` : 'No sound detected'}
              </span>
            </div>

            {/* Sequence Flow */}
            <div className={styles.sequenceFlow}>
              {exercise.steps.map((step, idx) => {
                let stepClass = styles.stepBubble;
                if (stepStates[idx] === 'success') stepClass += ` ${styles.stepSuccess}`;
                else if (stepStates[idx] === 'failed') stepClass += ` ${styles.stepFailed}`;
                else if (currentStep === idx) stepClass += ` ${styles.stepActive}`;

                return (
                  <div key={idx} className={stepClass}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepDesc}>{step.instruction}</span>
                  </div>
                );
              })}
            </div>

            {/* Realtime Feedback Console */}
            <div className={`${styles.feedbackConsole} ${styles[feedbackType]}`}>
              <span className="material-symbols-outlined">
                {feedbackType === 'success' ? 'check_circle' : feedbackType === 'error' ? 'cancel' : feedbackType === 'warning' ? 'error' : 'info'}
              </span>
              <p>{feedbackMsg}</p>
            </div>

            {/* Volume/Sustain Gauge */}
            <div className={styles.sustainContainer}>
              <div className={styles.sustainHeader}>
                <span>Sustain Strength (RMS)</span>
                <span>{Math.round(rms * 1000)} / 1000</span>
              </div>
              <div className={styles.sustainBarBg}>
                <div 
                  className={styles.sustainBarFill} 
                  style={{ width: `${Math.min(100, rms * 500)}%` }}
                />
                {/* Sustain threshold line */}
                <div className={styles.sustainThresholdLine} style={{ left: '15%' }} title="Target Legato Volume" />
              </div>
              {rms > 0 && rms < 0.03 && (
                <p className={styles.sustainWarning}>Sustain dropping! Keep your fingers pressing firmly.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegatoMode;
