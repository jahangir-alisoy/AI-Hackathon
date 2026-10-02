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
        <NavLink to="/" end className={LINK}><Home size={17} /> Home</NavLink>
        <NavLink to="/inbox/all" className={LINK}><Inbox size={17} /> Inbox {unread > 0 && <span className="nav__count">{unread}</span>}</NavLink>
        <NavLink to="/calendar" className={LINK}><CalendarDays size={17} /> Calendar</NavLink>
        <NavLink to="/outbox" className={LINK}><Send size={17} /> Sent</NavLink>
        <NavLink to="/briefings" className={LINK}><BookOpen size={17} /> Briefings</NavLink>
        <NavLink to="/lab" className={LINK}><FlaskConical size={17} /> Train Lab</NavLink>
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
