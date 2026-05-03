import React from 'react';
import { NOTES, STRING_ROOTS, STRING_MIDI_ROOTS, getScale, getPentatonic, getShapeFretWindow, getChordTones } from '../utils/musicLogic';
import styles from './Fretboard.module.css';

const Fretboard = ({ keyIndex, isMinor, shape, showPentatonic = true, showChord = false, activeMidiNote = null, isPlayMode = false, playedNotes = null, targetMidiNotes = [] }) => {
  const scale = getScale(keyIndex, isMinor);
  const pentatonic = getPentatonic(scale, isMinor);
  const chordTones = getChordTones(scale);
  const windowBounds = getShapeFretWindow(shape, keyIndex, isMinor);

  const numFrets = 22;
  const strings = [0, 1, 2, 3, 4, 5]; // 1st (high e) to 6th (low E)
  const frets = Array.from({ length: numFrets + 1 }, (_, i) => i);

  return (
    <div className={styles.fretboardContainer}>
      <div className={styles.fretboard}>
        <div className={styles.fretsBg}>
          {frets.map(f => (
            <div key={`fret-bg-${f}`} className={`${styles.fretBg} ${f === 0 ? styles.nut : ''}`}>
              {f > 0 && [3, 5, 7, 9, 15, 17, 19, 21].includes(f) && <div className={`${styles.dot} single-dot`}></div>}
              {f > 0 && f === 12 && <div className={`${styles.dot} ${styles.doubleDot}`}></div>}
            </div>
          ))}
        </div>
        
        <div className={styles.stringsContainer}>
          {strings.map(sIndex => (
            <div key={`string-${sIndex}`} className={styles.guitarString}>
              {frets.map(f => {
                const noteIndex = (STRING_ROOTS[sIndex] + f) % 12;
                const isInScale = scale.includes(noteIndex);
                const isPentatonic = pentatonic.includes(noteIndex);
                const isChordTone = chordTones.includes(noteIndex);
                const isRoot = noteIndex === keyIndex;
                
                const inBaseWindow = f >= windowBounds[0] && f <= windowBounds[1];
                const inOctaveUp = f >= windowBounds[0] + 12 && f <= windowBounds[1] + 12;
                const inOctaveDown = f >= windowBounds[0] - 12 && f <= windowBounds[1] - 12;
                const isInWindow = inBaseWindow || inOctaveUp || inOctaveDown;

                const isGString = sIndex === 2;
                const isCShapeException = shape === 'C' && isGString && (
                  f === windowBounds[0] + 4 || 
                  f === windowBounds[0] + 16 || 
                  f === windowBounds[0] - 8
                );

                const absoluteMidiNote = STRING_MIDI_ROOTS[sIndex] + f;

                const isTarget = isInScale && isInWindow && !isCShapeException;
                const isPlayed = playedNotes && playedNotes.includes(absoluteMidiNote);
                const isWrongPitch = isPlayed && targetMidiNotes.length > 0 && !targetMidiNotes.includes(absoluteMidiNote);
                
                let showNote = false;
                if (isPlayMode) {
                  showNote = (activeMidiNote === absoluteMidiNote);
                } else if (playedNotes !== null) {
                  // In "Show Answer" mode with connected guitar: show target notes AND any wrong notes played
                  showNote = isTarget || isWrongPitch;
                } else {
                  // Normal "Show Answer" mode (not connected)
                  showNote = isTarget;
                }

                const showPentatonicHighlight = !isPlayMode && showPentatonic && isPentatonic && isTarget;
                const showChordHighlight = !isPlayMode && showChord && isChordTone && isTarget;
                const isActivePitch = isPlayMode && (activeMidiNote === absoluteMidiNote);

                let evaluationClass = '';
                if (playedNotes !== null && showNote) {
                  if (isPlayed && isTarget) {
                    evaluationClass = styles.correctNote;
                  } else if (isPlayed && !isTarget) {
                    evaluationClass = styles.incorrectNote;
                  }
                }

                return (
                  <div key={`note-${sIndex}-${f}`} className={`${styles.fretCell} ${f === 0 ? styles.openStringCell : ''}`}>
                    {showNote && (
                      <div className={`${styles.noteCircle} 
                        ${isRoot && !isPlayMode && !evaluationClass ? styles.rootNote : styles.scaleNote} 
                        ${showPentatonicHighlight ? styles.pentatonicShadow : ''}
                        ${showChordHighlight ? styles.chordHighlight : ''}
                        ${isActivePitch ? styles.activePitchHighlight : ''}
                        ${evaluationClass}`}
                      >
                        {NOTES[noteIndex]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.fretNumbers}>
        {frets.map(f => (
          <div key={`num-${f}`} className={styles.fretNum}>{f}</div>
        ))}
      </div>
    </div>
  );
};

export default Fretboard;
