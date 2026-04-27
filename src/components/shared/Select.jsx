import React from 'react';

const Select = ({ label, children, className = '', containerStyle = {}, ...props }) => {
  return (
    <div className={`control-group ${className}`.trim()} style={containerStyle}>
      {label && <label>{label}</label>}
      <select {...props}>
        {children}
      </select>
    </div>
  );
};

export default Select;
