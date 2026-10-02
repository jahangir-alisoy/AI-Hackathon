import { NavLink } from 'react-router-dom';
import { BookOpen, CalendarDays, FlaskConical, Home, Inbox, Moon, Plus, Send, Settings, Sun } from 'lucide-react';
import { Avatar } from '../components/Avatar.jsx';
import { ChannelIcon } from '../components/Badges.jsx';
import { useResource } from '../lib/useResource.js';
import { useSettings } from '../lib/SettingsContext.jsx';

const LINK = ({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`;

const isDark = (theme) => theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

export const Sidebar = ({ onCompose, onNavigate }) => {
  const { settings, update } = useSettings();
  const overview = useResource('/overview', { refreshOn: ['message.', 'messages.'] });
  const counts = overview.data?.counts;
  const unread = (channel) => counts?.[channel]?.unread || null;
  const allUnread = counts ? Object.values(counts).reduce((sum, item) => sum + item.unread, 0) : null;
  const theme = settings?.theme ?? 'system';

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="brand-mark" aria-hidden="true">✳</span>
        <span className="brand-name">{settings?.assistantName ?? 'StandIn'}</span>
      </div>
      <button className="sidebar__compose" onClick={onCompose}>
        <Plus size={16} /> New incoming message
      </button>
      <nav className="nav" onClick={onNavigate}>
        <NavLink to="/" end className={LINK}><Home size={16} /> Home</NavLink>
        <NavLink to="/inbox/all" className={LINK}><Inbox size={16} /> All messages {allUnread ? <span className="nav__count">{allUnread}</span> : null}</NavLink>
        <div className="nav__group">Channels</div>
        <NavLink to="/inbox/slack" className={LINK}><ChannelIcon channel="slack" size={16} /> Slack {unread('slack') && <span className="nav__count">{unread('slack')}</span>}</NavLink>
        <NavLink to="/inbox/email" className={LINK}><ChannelIcon channel="email" size={16} /> Email {unread('email') && <span className="nav__count">{unread('email')}</span>}</NavLink>
        <NavLink to="/inbox/system" className={LINK}><ChannelIcon channel="system" size={16} /> System {unread('system') && <span className="nav__count">{unread('system')}</span>}</NavLink>
        <NavLink to="/calendar" className={LINK}><CalendarDays size={16} /> Calendar</NavLink>
        <div className="nav__group">Assistant</div>
        <NavLink to="/outbox" className={LINK}><Send size={16} /> Drafts &amp; sent</NavLink>
        <NavLink to="/briefings" className={LINK}><BookOpen size={16} /> Briefings</NavLink>
        <NavLink to="/lab" className={LINK}><FlaskConical size={16} /> AI Train Lab</NavLink>
        <NavLink to="/settings" className={LINK}><Settings size={16} /> Settings</NavLink>
      </nav>
      <div className="sidebar__footer">
        <Avatar name={settings?.ceoName ?? ''} size={30} />
        <div className="sidebar__user">
          <strong>{settings?.ceoName}</strong>
          <span>{settings?.company}</span>
        </div>
        <button
          className="icon-btn"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          onClick={() => update({ theme: isDark(theme) ? 'light' : 'dark' })}
        >
          {isDark(theme) ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </aside>
  );
};
