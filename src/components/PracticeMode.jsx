import React, { useState, useEffect, useRef } from 'react';
import Fretboard from './Fretboard';
import { NOTES, getShapeMidiNotes } from '../utils/musicLogic';
import confetti from 'canvas-confetti';
import Toggle from './shared/Toggle';
import Button from './shared/Button';
import styles from './PracticeMode.module.css';

const SHAPES = ['C', 'A', 'G', 'E', 'D'];

const PracticeMode = ({ activePitchData, isGuitarConnected }) => {
  const [challenge, setChallenge] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showPentatonic, setShowPentatonic] = useState(true);
  const [showChord, setShowChord] = useState(false);
  const [allowedKeys, setAllowedKeys] = useState(NOTES.map((_, i) => i));
  const [allowedScales, setAllowedScales] = useState(['major', 'minor']);
  const [playedNotes, setPlayedNotes] = useState([]);
  const [targetNotes, setTargetNotes] = useState([]);
  
  const playedNotesRef = useRef(playedNotes);
  const targetNotesRef = useRef(targetNotes);
  const challengeRef = useRef(challenge);

  // Keep refs up to date for the event handlers
  useEffect(() => { playedNotesRef.current = playedNotes; }, [playedNotes]);
  useEffect(() => { targetNotesRef.current = targetNotes; }, [targetNotes]);
  useEffect(() => { challengeRef.current = challenge; }, [challenge]);

  const consecutiveNoteRef = useRef({ note: null, count: 0 });

  // Audio Tracking
  useEffect(() => {
    if (!isGuitarConnected || !challenge || showAnswer) {
      consecutiveNoteRef.current = { note: null, count: 0 };
      return;
    }

    if (!activePitchData) {
      consecutiveNoteRef.current = { note: null, count: 0 };
      return;
    }

    const midiNote = activePitchData.midiNote;
    
    // Calculate the absolute bounds of the current challenge
    let minTarget = Infinity;
    let maxTarget = -Infinity;
    if (targetNotesRef.current.length > 0) {
      for (let set of targetNotesRef.current) {
        for (let n of set) {
          if (n < minTarget) minTarget = n;
          if (n > maxTarget) maxTarget = n;
        }
      }
      
      // Filter out extreme false positives (sympathetic resonance of open strings, high harmonics)
      // If a note is more than 4 semitones outside the entire shape's range, ignore it.
      if (midiNote < minTarget - 4 || midiNote > maxTarget + 4) {
        consecutiveNoteRef.current = { note: null, count: 0 };
        return;
      }
    }
    
    // Debounce: require note to be detected for 5 consecutive frames
    if (consecutiveNoteRef.current.note === midiNote) {
      consecutiveNoteRef.current.count += 1;
    } else {
      consecutiveNoteRef.current = { note: midiNote, count: 1 };
    }

    if (consecutiveNoteRef.current.count < 5) {
      return; // Not held long enough yet
    }

    // Only add if it's different from the last note played
    const lastPlayedNote = playedNotesRef.current.length > 0 
      ? playedNotesRef.current[playedNotesRef.current.length - 1] 
      : null;

    if (midiNote !== lastPlayedNote) {
      const newPlayed = [...playedNotesRef.current, midiNote];
      setPlayedNotes(newPlayed);

      // Check success: user must complete AT LEAST ONE of the octave regions fully, up and down
      let success = false;
      for (let targetSet of targetNotesRef.current) {
        // Construct the up and down sequence
        const sortedTarget = Array.from(targetSet).sort((a, b) => a - b);
        if (sortedTarget.length === 0) continue;
        
        // Up and down sequence: 1 2 3 4 5 4 3 2 1
        const targetSequence = [...sortedTarget, ...sortedTarget.slice(0, -1).reverse()];
        
        // Check if newPlayed contains targetSequence as a subsequence
        let seqIndex = 0;
        for (let played of newPlayed) {
          if (played === targetSequence[seqIndex]) {
            seqIndex++;
            if (seqIndex === targetSequence.length) {
              success = true;
              break;
            }
          }
        }
        
        if (success) {
          break;
        }
      }

      if (success) {
        // Trigger Fireworks!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
        
        // Wait 1.5 seconds then pick next challenge
        setTimeout(() => {
          pickRandom();
        }, 1500);
      }
    }
  }, [activePitchData, isGuitarConnected, challenge, showAnswer]);

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
    setTargetNotes(getShapeMidiNotes(randomShape, randomKey, randomIsMinor));
    setPlayedNotes([]);
    setShowAnswer(false);
  };

  return (
    <div className={styles.practiceMode}>
      <div className={`glass-panel`} style={{flexDirection: 'column', alignItems: 'center', display: 'flex', padding: '2rem'}}>
        <div className={styles.practiceHeader}>
          <h2>Practice Mode</h2>
          <p style={{color: 'var(--text-secondary)'}}>Configure and test your knowledge of the CAGED system</p>
        </div>
        
        <div style={{width: '100%', maxWidth: '600px', marginBottom: '2rem', textAlign: 'left', borderTop: '1px solid var(--panel-border)', borderBottom: '1px solid var(--panel-border)', padding: '1.5rem 0'}}>
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

        <div className={styles.practiceActions}>
          <Button onClick={pickRandom}>Pick Random Challenge</Button>
          {challenge && (
            <Button variant="secondary" onClick={() => setShowAnswer(true)} disabled={showAnswer}>
              Show Answer
            </Button>
          )}
        </div>
      </div>

      {challenge && (
        <div className={`${styles.challengeDisplay} glass-panel fade-in`}>
          <h3 className={styles.challengeText}>
            Find the <span className={styles.highlightText}>{NOTES[challenge.keyIndex]} {challenge.isMinor ? 'Minor' : 'Major'}</span> scale in the <span className={styles.highlightText}>{challenge.shape} Shape</span>
          </h3>
        </div>
      )}

      {challenge && showAnswer && (
        <div className={`${styles.fretboardWrapper} glass-panel reveal-animation`}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem'}}><span style={{display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--note-scale-bg)', boxShadow: 'var(--pentatonic-glow)', border: '2px solid var(--text-primary)'}}></span> Pentatonic notes highlighted</p>
              <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem'}}><span style={{display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--text-primary)'}}></span> Chord notes highlighted</p>
            </div>
            <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <label style={{fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500}}>Highlight Pentatonic</label>
                <Toggle id="practice-pentatonic-toggle" checked={showPentatonic} onChange={setShowPentatonic} />
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <label style={{fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500}}>Highlight Chord</label>
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
            playedNotes={isGuitarConnected ? playedNotes : null}
            targetMidiNotes={Array.from(new Set(targetNotes.flatMap(set => Array.from(set))))}
          />
        </div>
      )}
      
      {!challenge && (
        <div className={`${styles.emptyState} glass-panel`}>
          <p>Click "Pick Random Challenge" to begin.</p>
        </div>
      )}
    </div>
  );
};

export default PracticeMode;
