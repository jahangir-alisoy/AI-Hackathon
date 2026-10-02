import { DeadlineChip } from '../components/DeadlineChip.jsx';
import { Sources } from '../components/Sources.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const Stat = ({ value, label, tone }) => (
  <div className={`stat ${tone ?? ''}`}>
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);

export const TodayView = ({ today, onOpen }) => (
  <div className="stack">
    <section className="stats">
      <Stat value={today.counts.messages} label="emails & Slack messages read" />
      <Stat value={today.counts.needsYou} label="things only you can do" tone="accent" />
      <Stat value={today.counts.handledForYou} label="handled or filtered for you" />
      <Stat value={today.counts.findings} label="problems caught" tone="warn" />
    </section>

    <section>
      <h2>Needs you</h2>
      {today.needsYou.length === 0 && <p className="muted">Nothing needs you right now.</p>}
      <div className="cards">
        {today.needsYou.map((card) => (
          <article key={card.topic} className="card needs">
            <header className="card-head">
              <h3>{card.label}</h3>
              <DeadlineChip deadline={card.deadline} />
            </header>
            <p className="action">{card.action}</p>
            <p className="muted small">
              Asked by {card.askedBy.join(', ')} · {card.nudges} message{card.nudges > 1 ? 's' : ''} · latest {card.latestAt}
            </p>
            <Sources sources={card.asks.map((ask) => ask.ref)} />
            {card.deliverable && (
              <button className="primary" onClick={() => onOpen(card.deliverable)}>Open the draft StandIn prepared</button>
            )}
          </article>
        ))}
      </div>
    </section>

    <div className="two-col">
      <section>
        <h2>Deadline radar</h2>
        <ul className="list">
          {today.deadlines.map((deadline) => (
            <li key={deadline.topic} className="list-row">
              <span>{deadline.label}</span>
              <DeadlineChip deadline={deadline} />
            </li>
          ))}
          {today.defaultActions.map((action) => (
            <li key={action.source} className="list-row warn-row">
              <span>{action.actor} sends at {action.at} unless you object</span>
              {action.lateBy ? <StatusBadge status="missed" /> : null}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Top problems caught</h2>
        <ul className="list">
          {today.findings.filter((finding) => finding.severity === 'high').map((finding) => (
            <li key={finding.title} className="list-row column">
              <strong>{finding.title}</strong>
              <span className="muted small">{finding.detail}</span>
            </li>
          ))}
        </ul>
        <button className="link" onClick={() => onOpen('caught')}>See all {today.findings.length} →</button>
      </section>
    </div>
  </div>
);
