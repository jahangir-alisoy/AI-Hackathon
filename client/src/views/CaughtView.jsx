import { Sources } from '../components/Sources.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

export const CaughtView = ({ findings }) => (
  <div className="stack">
    <p className="lead">The sources contradict each other. StandIn cross-checks them before it summarizes anything.</p>
    {findings.map((finding) => (
      <article key={`${finding.kind}-${finding.title}`} className={`card finding finding-${finding.severity}`}>
        <header className="card-head">
          <h3>{finding.title}</h3>
          <StatusBadge status={finding.severity} />
        </header>
        <p>{finding.detail}</p>
        <Sources sources={finding.sources} />
      </article>
    ))}
  </div>
);
