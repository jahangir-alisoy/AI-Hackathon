import { postJson } from '../api.js';
import { useApi } from '../useApi.js';

export const OutboxView = ({ version, onReset }) => {
  const outbox = useApi(`/outbox?v=${version}`);
  const reset = async () => {
    await postJson('/reset');
    onReset();
  };
  return (
    <div className="stack">
      <div className="card-head">
        <p className="lead">Nothing leaves without your approval. This is the audit log of every decision.</p>
        <button className="ghost" onClick={reset}>Reset demo</button>
      </div>
      {outbox.data?.length === 0 && <p className="muted">No decisions yet.</p>}
      {outbox.data?.map((entry) => (
        <article key={entry.id} className="card">
          <header className="card-head">
            <h3>{entry.type}</h3>
            <span className={`badge badge-${entry.decision === 'approved' ? 'done' : 'missed'}`}>{entry.decision}</span>
          </header>
          <p className="muted small">Simulated time {entry.asOf} · {new Date(entry.decidedAt).toLocaleTimeString()} · {entry.status}</p>
          <pre className="doc">{entry.content}</pre>
        </article>
      ))}
    </div>
  );
};
