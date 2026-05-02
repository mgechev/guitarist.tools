import React from 'react';
import styles from './Select.module.css';

const Select = ({ label, children, className = '', containerStyle = {}, ...props }) => {
  return (
    <div className={`${styles.controlGroup} ${className}`.trim()} style={containerStyle}>
      {label && <label>{label}</label>}
      <select {...props}>
        {children}
      </select>
    </div>
  );
};

export default Select;
