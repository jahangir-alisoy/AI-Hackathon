import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { LiveNotifier } from './LiveNotifier.jsx';
import { NewMessageModal } from '../features/compose/NewMessageModal.jsx';

export const Layout = () => {
  const [composing, setComposing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={`shell ${menuOpen ? 'shell--menu-open' : ''}`}>
      <Sidebar onCompose={() => setComposing(true)} onNavigate={() => setMenuOpen(false)} />
      <div className="shell__scrim" onClick={() => setMenuOpen(false)} />
      <main className="shell__main">
        <button className="icon-btn shell__menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
        <Outlet context={{ openComposer: () => setComposing(true) }} />
      </main>
      <LiveNotifier />
      {composing && <NewMessageModal onClose={() => setComposing(false)} />}
    </div>
  );
};
