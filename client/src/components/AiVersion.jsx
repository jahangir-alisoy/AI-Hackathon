export const AiVersion = ({ ai }) => (
  <section className="card ai">
    <header className="card-head">
      <h3>Claude-polished version</h3>
      <span className="muted small">{ai.model} · {ai.citations.cited} sources cited</span>
    </header>
    {ai.citations.unknown.length > 0 && (
      <p className="error small">Unverified sources in the AI text: {ai.citations.unknown.join(', ')} — check before approving.</p>
    )}
    <pre className="doc">{ai.markdown}</pre>
  </section>
);
