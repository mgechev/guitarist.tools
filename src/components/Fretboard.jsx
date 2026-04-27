import React from 'react';
import { NOTES, STRING_ROOTS, getScale, getPentatonic, getShapeFretWindow, getChordTones } from '../utils/musicLogic';

const Fretboard = ({ keyIndex, isMinor, shape, showPentatonic = true, showChord = false }) => {
  const scale = getScale(keyIndex, isMinor);
  const pentatonic = getPentatonic(scale, isMinor);
  const chordTones = getChordTones(scale);
  const windowBounds = getShapeFretWindow(shape, keyIndex);

  const numFrets = 22;
  const strings = [0, 1, 2, 3, 4, 5]; // 1st (high e) to 6th (low E)
  const frets = Array.from({ length: numFrets + 1 }, (_, i) => i);

  return (
    <div className="fretboard-container">
      <div className="fretboard">
        <div className="frets-bg">
          {frets.map(f => (
            <div key={`fret-bg-${f}`} className={`fret-bg ${f === 0 ? 'nut' : ''}`}>
              {f > 0 && [3, 5, 7, 9, 15, 17, 19, 21].includes(f) && <div className="dot single-dot"></div>}
              {f > 0 && f === 12 && <div className="dot double-dot"></div>}
            </div>
          ))}
        </div>
        
        <div className="strings-container">
          {strings.map(sIndex => (
            <div key={`string-${sIndex}`} className="guitar-string">
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

                const showNote = isInScale && isInWindow;
                const showPentatonicHighlight = showPentatonic && isPentatonic;
                const showChordHighlight = showChord && isChordTone;

                return (
                  <div key={`note-${sIndex}-${f}`} className={`fret-cell ${f === 0 ? 'open-string-cell' : ''}`}>
                    {showNote && (
                      <div className={`note-circle 
                        ${isRoot ? 'root-note' : 'scale-note'} 
                        ${showPentatonicHighlight ? 'pentatonic-shadow' : ''}
                        ${showChordHighlight ? 'chord-highlight' : ''}`}
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
      <div className="fret-numbers">
        {frets.map(f => (
          <div key={`num-${f}`} className="fret-num">{f}</div>
        ))}
      </div>
    </div>
  );
};

export default Fretboard;
