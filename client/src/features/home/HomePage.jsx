import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, ShieldAlert, Sparkles } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { ChannelIcon, PriorityBadge, CategoryBadge } from '../../components/Badges.jsx';
import { Avatar } from '../../components/Avatar.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { formatDay, formatRelative, formatTime, greeting, zoned } from '../../lib/format.js';

const CHANNEL_TILES = [
  { channel: 'slack', label: 'Slack', to: '/inbox/slack' },
  { channel: 'email', label: 'Email', to: '/inbox/email' },
  { channel: 'system', label: 'System', to: '/inbox/system' },
];

export const HomePage = () => {
  const { settings, timeZone } = useSettings();
  const navigate = useNavigate();
  const overview = useResource('/overview', { refreshOn: ['message.', 'messages.', 'activity.', 'event.'] });
  const data = overview.data;
  if (!data || !settings) return <div className="page"><p className="muted">Loading your day…</p></div>;

  const nowMinutes = zoned(new Date().toISOString(), timeZone).minutes;
  const upcoming = data.today.filter((event) => zoned(event.end, timeZone).minutes >= nowMinutes);

  return (
    <div className="page page--home">
      <section className="hero">
        <span className="hero__spark" aria-hidden="true">✳</span>
        <h1 className="hero__title">{greeting(timeZone)}, {settings.ceoName.split(' ')[0]}</h1>
        <p className="hero__subtitle">
          {data.totals.needsYou} things need you · {data.totals.handled} handled by {settings.assistantName} · {formatDay(new Date().toISOString(), timeZone)}
        </p>
      </section>

      <div className="tiles">
        {CHANNEL_TILES.map((tile) => (
          <Link key={tile.channel} to={tile.to} className={`tile tile--${tile.channel}`}>
            <ChannelIcon channel={tile.channel} size={18} />
            <span className="tile__label">{tile.label}</span>
            <span className="tile__numbers">
              <strong>{data.counts[tile.channel].unread}</strong> unread
              {data.counts[tile.channel].urgent > 0 && <em>{data.counts[tile.channel].urgent} urgent</em>}
            </span>
          </Link>
        ))}
        <Link to="/calendar" className="tile tile--events">
          <span className="channel-icon channel-icon--events"><CalendarDays size={18} /></span>
          <span className="tile__label">Calendar</span>
          <span className="tile__numbers"><strong>{upcoming.length}</strong> left today</span>
        </Link>
      </div>

      <div className="home-grid">
        <Card title="Most urgent" action={<Link to="/inbox/all" className="link">Open inbox <ArrowRight size={14} /></Link>}>
          {data.urgent.length === 0 && <EmptyState icon={Sparkles} title="You’re clear" text="Nothing urgent right now." />}
          <ul className="urgent-list">
            {data.urgent.map((message) => (
              <li key={message.id}>
                <button className="urgent-item" onClick={() => navigate(`/inbox/${message.channel}/${message.id}`)}>
                  <Avatar name={message.from.name} size={34} />
                  <span className="urgent-item__main">
                    <span className="urgent-item__top">
                      <strong>{message.from.name}</strong>
                      <ChannelIcon channel={message.channel} />
                      <span className="muted small">{formatTime(message.receivedAt, timeZone)}</span>
                    </span>
                    <span className="urgent-item__text">{message.subject || message.body}</span>
                    <span className="urgent-item__why">{message.classification.reasons.at(-1)?.text}</span>
                  </span>
                  <span className="urgent-item__badges">
                    <PriorityBadge priority={message.classification.priority} />
                    <CategoryBadge category={message.classification.category} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="home-side">
          {data.fraud.length > 0 && (
            <Card className="card--alert" title={<span className="alert-title"><ShieldAlert size={16} /> Suspected fraud</span>}>
              {data.fraud.map((message) => (
                <button key={message.id} className="plain-row" onClick={() => navigate(`/inbox/${message.channel}/${message.id}`)}>
                  <strong>{message.subject || message.body.slice(0, 60)}</strong>
                  <span className="muted small">{message.from.handle ?? message.from.name}</span>
                </button>
              ))}
            </Card>
          )}

          <Card title="Rest of today" action={<Link to="/calendar" className="link">Calendar <ArrowRight size={14} /></Link>}>
            {upcoming.length === 0 && <p className="muted small">No more meetings today.</p>}
            <ul className="agenda">
              {upcoming.slice(0, 6).map((event) => (
                <li key={event.id} className="agenda__item">
                  <span className="agenda__time">{formatTime(event.start, timeZone)}</span>
                  <span className="agenda__title">{event.title}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="What StandIn did" action={<Link to="/outbox" className="link">All <ArrowRight size={14} /></Link>}>
            <ul className="activity">
              {data.activity.slice(0, 7).map((entry) => (
                <li key={entry.id} className={`activity__item activity__item--${entry.type}`}>
                  <span>{entry.text}</span>
                  <span className="muted small">{formatRelative(entry.at)}</span>
                </li>
              ))}
              {data.activity.length === 0 && <li className="muted small">Simulate a message to see the pipeline work.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
