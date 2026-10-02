import { useState } from 'react';
import { postJson } from '../api.js';

export const ApprovalPanel = ({ type, asOf, label, initialContent, onDecided }) => {
  const [content, setContent] = useState(initialContent);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const decide = async (decision) => {
    setError(null);
    try {
      setResult(await postJson(`/approve/${type}`, { decision, content, asOf }));
      onDecided();
    } catch (failure) {
      setError(failure.message);
    }
  };

  return (
    <aside className="approval">
      <h3>Your decision</h3>
      <p className="muted small">Edit freely. Nothing is sent until you approve.</p>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={18} />
      <div className="actions">
        <button className="primary" onClick={() => decide('approved')}>{label}</button>
        <button className="ghost" onClick={() => decide('rejected')}>Reject</button>
      </div>
      {result && <p className="ok small">Recorded: {result.decision} · {result.status}</p>}
      {error && <p className="error small">{error}</p>}
    </aside>
  );
};
