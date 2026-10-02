const PRESETS = [
  { time: '08:30', label: 'Inbox skim' },
  { time: '10:10', label: 'Interpreter cancels' },
  { time: '13:30', label: 'Journalist emails' },
  { time: '16:10', label: 'Final stretch' },
  { time: '16:50', label: 'Comms auto-send' },
];

export const ClockBar = ({ asOf, onChange, mode }) => (
  <div className="clockbar">
    <label className="clock">
      <span>Simulated time</span>
      <input type="time" value={asOf} min="07:00" max="18:00" onChange={(event) => event.target.value && onChange(event.target.value)} />
    </label>
    <div className="presets">
      {PRESETS.map((preset) => (
        <button key={preset.time} className={preset.time === asOf ? 'chip active' : 'chip'} onClick={() => onChange(preset.time)}>
          {preset.time} · {preset.label}
        </button>
      ))}
    </div>
    {mode && <span className={`mode mode-${mode}`}>{mode === 'ai' ? 'Claude drafting on' : 'Rules + templates (no API key)'}</span>}
  </div>
);
