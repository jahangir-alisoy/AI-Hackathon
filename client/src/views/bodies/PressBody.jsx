import { Sources } from '../../components/Sources.jsx';

export const PressBody = ({ data }) => (
  <div className="stack">
    {data.warnings.map((warning) => (
      <article key={warning.text} className="card finding finding-high">
        <p><strong>⚠ {warning.text}</strong></p>
        <Sources sources={warning.sources} />
      </article>
    ))}
    <div className="two-col">
      <article className="card">
        <h3>What the reporter asks</h3>
        <ol>{data.questions.map((question) => <li key={question}>{question}</li>)}</ol>
      </article>
      <article className="card">
        <h3>What is true (internal)</h3>
        <ul>{data.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
      </article>
    </div>
    <article className="card">
      <h3>Draft statement</h3>
      <blockquote>{data.statement}</blockquote>
      <ul className="muted small">{data.guardrails.map((rail) => <li key={rail}>{rail}</li>)}</ul>
    </article>
  </div>
);
