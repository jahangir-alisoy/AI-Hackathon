export const Segmented = ({ options, value, onChange, label }) => (
  <div className="segmented" role="radiogroup" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        role="radio"
        aria-checked={option.value === value}
        className={`segmented__item ${option.value === value ? 'is-active' : ''}`}
        onClick={() => onChange(option.value)}
      >
        {option.icon && <option.icon size={14} aria-hidden="true" />}
        {option.label}
      </button>
    ))}
  </div>
);
