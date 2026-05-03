import React, { useEffect, useRef, useState } from 'react';
import Button from './shared/Button';
import styles from './TabDisplay.module.css';

const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'];
const COLUMN_WIDTH = 32;
const LABELS_WIDTH = 40;

const TabDisplay = ({ notes = [], onClear }) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const [notesPerRow, setNotesPerRow] = useState(20);

  // Measure available width and calculate notes per row
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const availableWidth = width - LABELS_WIDTH - 32; // padding offset
        const maxColumns = Math.max(1, Math.floor(availableWidth / COLUMN_WIDTH));
        setNotesPerRow(maxColumns);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-scroll vertically when notes change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes, notesPerRow]);

  // Chunk notes into rows
  const rows = [];
  for (let i = 0; i < Math.max(1, notes.length); i += notesPerRow) {
    rows.push(notes.slice(i, i + notesPerRow));
  }

  return (
    <div className={styles.tabWrapper} ref={containerRef}>
      <div className={styles.tabHeader}>
        <h3 className={styles.tabTitle}>Infinite Tab</h3>
        <Button variant="secondary" onClick={onClear} disabled={notes.length === 0}>
          Clear Tab
        </Button>
      </div>
      
      <div className={styles.tabContent} ref={scrollRef}>
        {notes.length === 0 ? (
          <div className={styles.emptyState}>
            Play notes to generate tab...
          </div>
        ) : (
          rows.map((rowNotes, rowIndex) => (
            <div key={rowIndex} className={styles.tabRow}>
              <div className={styles.stringLabels}>
                {STRINGS.map((str, idx) => (
                  <div key={idx} className={styles.stringLabel}>{str}</div>
                ))}
              </div>
              
              <div className={styles.scrollArea}>
                {rowNotes.map((note, colIndex) => (
                  <div key={note.id || colIndex} className={styles.tabColumn}>
                    {[0, 1, 2, 3, 4, 5].map(stringIndex => {
                      const isPlayedString = note.stringIndex === stringIndex;
                      return (
                        <div key={stringIndex} className={styles.tabCell}>
                          {isPlayedString ? <span>{note.fret}</span> : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TabDisplay;
