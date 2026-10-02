import { NavLink } from 'react-router-dom';
import { BookOpen, CalendarDays, FlaskConical, Home, Inbox, Moon, Plus, Send, Settings, Sun } from 'lucide-react';
import { Avatar } from '../components/Avatar.jsx';
import { useResource } from '../lib/useResource.js';
import { useSettings } from '../lib/SettingsContext.jsx';

const LINK = ({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`;

const isDark = (theme) => theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

export const Sidebar = ({ onCompose, onNavigate }) => {
  const { settings, update } = useSettings();
  const overview = useResource('/overview', { refreshOn: ['message.', 'messages.'] });
  const counts = overview.data?.counts;
  const unread = counts ? Object.values(counts).reduce((sum, item) => sum + item.unread, 0) : 0;
  const theme = settings?.theme ?? 'system';

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="brand-mark" aria-hidden="true">✳</span>
        <span className="brand-name">{settings?.assistantName ?? 'StandIn'}</span>
      </div>
      <button className="sidebar__compose" onClick={onCompose}>
        <Plus size={16} /> New message
      </button>
      <nav className="nav" onClick={onNavigate}>
        <NavLink to="/" end className={LINK}><span className="nav__icon"><Home size={16} /></span> Home</NavLink>
        <NavLink to="/inbox/all" className={LINK}><span className="nav__icon"><Inbox size={16} /></span> Inbox {unread > 0 && <span className="nav__count">{unread}</span>}</NavLink>
        <NavLink to="/calendar" className={LINK}><span className="nav__icon"><CalendarDays size={16} /></span> Calendar</NavLink>
        <NavLink to="/outbox" className={LINK}><span className="nav__icon"><Send size={16} /></span> Sent</NavLink>
        <NavLink to="/briefings" className={LINK}><span className="nav__icon"><BookOpen size={16} /></span> Briefings</NavLink>
        <NavLink to="/lab" className={LINK}><span className="nav__icon"><FlaskConical size={16} /></span> Train Lab</NavLink>
      </nav>
      <div className="sidebar__footer">
        <Avatar name={settings?.ceoName ?? ''} size={28} />
        <span className="sidebar__user">{settings?.ceoName}</span>
        <button className="icon-btn" aria-label="Toggle dark mode" title="Dark mode" onClick={() => update({ theme: isDark(theme) ? 'light' : 'dark' })}>
          {isDark(theme) ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <NavLink to="/settings" className="icon-btn" aria-label="Settings" title="Settings" onClick={onNavigate}><Settings size={16} /></NavLink>
      </div>
    </aside>
  );
};
