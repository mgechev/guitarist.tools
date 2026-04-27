import React from 'react';

const Button = ({ variant = 'primary', className = '', children, ...props }) => {
  const btnClass = variant === 'primary' ? 'primary-btn' : 'secondary-btn';
  return (
    <button className={`${btnClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;
