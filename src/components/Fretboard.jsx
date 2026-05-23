import { useState, useEffect, useRef } from 'react';
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

  const containerRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(40);
  const [isScrollable, setIsScrollable] = useState(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const canScrollLeft = el.scrollLeft > 10;
    const canScrollRight = el.scrollWidth - el.clientWidth - el.scrollLeft > 10;
    setShowLeftFade(canScrollLeft);
    setShowRightFade(canScrollRight);

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      setIsScrollable(true);
      setScrollProgress((el.scrollLeft / maxScroll) * 100);
      const ratio = el.clientWidth / el.scrollWidth;
      const computedWidth = Math.max(40, Math.min(el.clientWidth / 3, el.clientWidth * ratio));
      setThumbWidth(computedWidth);
    } else {
      setIsScrollable(false);
    }
  };

  const handleSliderChange = (e) => {
    const el = containerRef.current;
    if (!el) return;
    const value = parseFloat(e.target.value);
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollLeft = (value / 100) * maxScroll;
    setScrollProgress(value);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      handleScroll();
      el.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
      
      const timer = setTimeout(handleScroll, 100);
      
      return () => {
        el.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        clearTimeout(timer);
      };
    }
  }, [keyIndex, isMinor, shape, activeMidiNote]);

  return (
    <div className={`${styles.fretboardOuter} ${showLeftFade ? styles.showLeftFade : ''} ${showRightFade ? styles.showRightFade : ''}`}>
      <div ref={containerRef} className={styles.fretboardContainer}>
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
                  
                  const showNote = isPlayMode
                    ? (activeMidiNote === absoluteMidiNote)
                    : (playedNotes !== null ? (isTarget || isWrongPitch) : isTarget);

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
      {isScrollable && (
        <div className={styles.scrollControlContainer}>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={scrollProgress}
            onChange={handleSliderChange}
            className={styles.scrollSlider}
            style={{ '--thumb-width': `${thumbWidth}px` }}
          />
        </div>
      )}
    </div>
  );
};

export default Fretboard;
