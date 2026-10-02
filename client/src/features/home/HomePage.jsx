import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Sparkles } from 'lucide-react';
import { ChannelIcon } from '../../components/Badges.jsx';
import { Avatar } from '../../components/Avatar.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { formatTime, greeting, zoned } from '../../lib/format.js';

const TILES = [
  { key: 'slack', label: 'Slack', to: '/inbox/slack' },
  { key: 'email', label: 'Email', to: '/inbox/email' },
  { key: 'system', label: 'System', to: '/inbox/system' },
];

export const HomePage = () => {
  const { settings, timeZone } = useSettings();
  const navigate = useNavigate();
  const overview = useResource('/overview', { refreshOn: ['message.', 'messages.', 'event.'] });
  const data = overview.data;
  if (!data || !settings) return <div className="page" />;

  const nowMinutes = zoned(new Date().toISOString(), timeZone).minutes;
  const upcoming = data.today.filter((event) => zoned(event.end, timeZone).minutes >= nowMinutes);
  const urgentCount = data.urgent.filter((message) => message.classification.priority === 'urgent').length;
  const open = (message) => navigate(`/inbox/${message.channel}/${message.id}`);

  return (
    <div className="page page--home">
      <section className="hero">
        <h1 className="hero__title">{greeting(timeZone)}, {settings.ceoName.split(' ')[0]}</h1>
        <p className="hero__subtitle">{urgentCount > 0 ? `${urgentCount} urgent things need you` : 'Nothing urgent right now'}</p>
      </section>

      <div className="tiles">
        {TILES.map((tile) => (
          <Link key={tile.key} to={tile.to} className="tile">
            <ChannelIcon channel={tile.key} size={16} />
            <span className="tile__label">{tile.label}</span>
            <strong className="tile__count">{data.counts[tile.key].unread}</strong>
          </Link>
        ))}
        <Link to="/calendar" className="tile">
          <ChannelIcon channel="events" size={16} />
          <span className="tile__label">Meetings left</span>
          <strong className="tile__count">{upcoming.length}</strong>
        </Link>
      </div>

      <div className="home-grid">
        <section className="panel">
          <header className="panel__header">
            <h2>Needs you</h2>
            <Link to="/inbox/all" className="link">See all</Link>
          </header>
          {data.urgent.length === 0 && <EmptyState icon={Sparkles} title="You’re clear" />}
          <ul className="simple-list">
            {data.urgent.slice(0, 6).map((message) => (
              <li key={message.id}>
                <button className="simple-row" onClick={() => open(message)}>
                  <span className={`dot dot--${message.classification.priority}`} aria-label={message.classification.priority} />
                  <Avatar name={message.from.name} size={30} />
                  <span className="simple-row__main">
                    <strong>{message.from.name}</strong>
                    <span>{message.subject || message.body}</span>
                  </span>
                  <span className="simple-row__time">{formatTime(message.receivedAt, timeZone)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="home-side">
          {data.fraud.length > 0 && (
            <button className="alert" onClick={() => open(data.fraud[0])}>
              <ShieldAlert size={18} />
              <span><strong>Possible phishing</strong><span>{data.fraud[0].subject || data.fraud[0].body.slice(0, 60)}</span></span>
            </button>
          )}
          <section className="panel">
            <header className="panel__header">
              <h2>Today</h2>
              <Link to="/calendar" className="link">Calendar</Link>
            </header>
            {upcoming.length === 0 && <p className="muted small">No more meetings.</p>}
            <ul className="agenda">
              {upcoming.slice(0, 5).map((event) => (
                <li key={event.id} className="agenda__item">
                  <span className="agenda__time">{formatTime(event.start, timeZone)}</span>
                  <span className="agenda__title">{event.title}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
