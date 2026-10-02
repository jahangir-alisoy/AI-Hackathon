import { Sources } from '../../components/Sources.jsx';

export const DavrKitBody = ({ data }) => (
  <div className="stack">
    <article className="card decision">
      <h3>Decision for you — {data.decision.askedBy ?? 'Davr Bank'} asks:</h3>
      <blockquote>{data.decision.question}</blockquote>
      <div className="options">
        {data.decision.options.map((option) => (
          <div key={option.key} className={option.key === data.decision.recommendation ? 'option recommended' : 'option'}>
            <strong>{option.key}. {option.label}</strong>
            <p>{option.detail}</p>
            {option.key === data.decision.recommendation && <span className="badge badge-done">StandIn recommends</span>}
          </div>
        ))}
      </div>
      <p className="small">{data.decision.reason}</p>
      <p className="muted small">{data.decision.humanOnly}</p>
      <Sources sources={data.decision.sources} />
    </article>

    <article className="card">
      <h3>Guardrails</h3>
      <ul className="lines">
        {data.guardrails.map((rail) => (
          <li key={rail.text} className="line line-VERIFY">
            <div>{rail.text}</div>
            <Sources sources={rail.sources} />
          </li>
        ))}
      </ul>
    </article>

    <article className="card">
      <h3>Talking points</h3>
      <ul>{data.talkingPoints.map((point) => <li key={point}>{point}</li>)}</ul>
    </article>

    <article className="card">
      <h3>Glossary — share this on screen</h3>
      <table className="glossary">
        <thead><tr><th>English</th><th>O‘zbekcha</th><th>Русский</th></tr></thead>
        <tbody>
          {data.glossary.map((entry) => (
            <tr key={entry.term}>
              <td><strong>{entry.term}</strong><div className="muted small">{entry.definition}</div></td>
              <td>{entry.uz}</td>
              <td>{entry.ru}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">Translations are prepared by StandIn — have a native speaker check them before sending anything binding.</p>
    </article>
  </div>
);
