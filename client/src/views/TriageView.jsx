import { useState } from 'react';

export const TriageView = ({ triage, labels, counts }) => {
  const [filter, setFilter] = useState('ALL');
  const visible = filter === 'ALL' ? triage : triage.filter((item) => item.category === filter);
  return (
    <div className="stack">
      <div className="presets">
        <button className={filter === 'ALL' ? 'chip active' : 'chip'} onClick={() => setFilter('ALL')}>All ({triage.length})</button>
        {Object.entries(labels).map(([key, label]) => (
          <button key={key} className={filter === key ? 'chip active' : 'chip'} onClick={() => setFilter(key)}>
            {label} ({counts.byCategory[key]})
          </button>
        ))}
      </div>
      <table className="triage">
        <thead>
          <tr><th>Time</th><th>Source</th><th>From</th><th>Message</th><th>StandIn decision</th></tr>
        </thead>
        <tbody>
          {visible.map((item) => (
            <tr key={item.id}>
              <td>{item.time}</td>
              <td className="small">{item.ref}</td>
              <td>{item.actor}</td>
              <td>{item.summary}</td>
              <td>
                <span className={`cat cat-${item.category}`}>{labels[item.category]}</span>
                <div className="muted small">{item.reason}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
