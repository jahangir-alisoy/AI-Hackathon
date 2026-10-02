export const Toggle = ({ checked, onChange, label, description, disabled = false }) => (
  <label className={`toggle ${disabled ? 'toggle--disabled' : ''}`}>
    <span className="toggle__text">
      <span className="toggle__label">{label}</span>
      {description && <span className="toggle__description">{description}</span>}
    </span>
    <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    <span className="toggle__track" aria-hidden="true"><span className="toggle__thumb" /></span>
  </label>
);
