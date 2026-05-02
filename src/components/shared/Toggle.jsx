import React from 'react';
import styles from './Toggle.module.css';

const Toggle = ({ id, checked, onChange, label, scale = 1, width = '44px', labelStyle = {} }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div className={styles.toggleContainer} style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'left center', width }}>
        <input 
          type="checkbox" 
          id={id} 
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <label htmlFor={id} className={styles.toggleLabel}></label>
      </div>
      {label && (
        <label htmlFor={id} style={{ cursor: 'pointer', ...labelStyle }}>
          {label}
        </label>
      )}
    </div>
  );
};

export default Toggle;
