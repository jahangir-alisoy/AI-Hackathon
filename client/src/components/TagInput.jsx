import { useState } from 'react';
import { X } from 'lucide-react';

export const TagInput = ({ values, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const value = draft.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setDraft('');
  };
  return (
    <div className="tag-input">
      {values.map((value) => (
        <span key={value} className="tag tag--removable">
          {value}
          <button aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}><X size={12} /></button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
};
