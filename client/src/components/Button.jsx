export const Button = ({ variant = 'secondary', size = 'md', icon: Icon, children, className = '', ...props }) => (
  <button className={`btn btn--${variant} btn--${size} ${className}`} {...props}>
    {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden="true" />}
    {children && <span>{children}</span>}
  </button>
);
