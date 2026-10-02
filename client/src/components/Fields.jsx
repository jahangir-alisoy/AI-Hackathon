export const Field = ({ label, hint, children }) => (
  <label className="field">
    {label && <span className="field__label">{label}</span>}
    {children}
    {hint && <span className="field__hint">{hint}</span>}
  </label>
);

export const Input = (props) => <input className="input" {...props} />;

export const Textarea = (props) => <textarea className="input input--area" {...props} />;

export const Select = ({ options, ...props }) => (
  <select className="input input--select" {...props}>
    {options.map((option) => {
      const { value, label } = typeof option === 'string' ? { value: option, label: option } : option;
      return <option key={value} value={value}>{label}</option>;
    })}
  </select>
);
