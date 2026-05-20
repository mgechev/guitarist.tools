
import styles from './Button.module.css';

const Button = ({ variant = 'primary', className = '', children, ...props }) => {
  const btnClass = variant === 'primary' ? styles.primaryBtn : styles.secondaryBtn;
  return (
    <button className={`${btnClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;
