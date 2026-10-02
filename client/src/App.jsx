import { useState } from 'react';
import { useApi } from './useApi.js';
import { ClockBar } from './components/ClockBar.jsx';
import { Tabs } from './components/Tabs.jsx';
import { TodayView } from './views/TodayView.jsx';
import { CaughtView } from './views/CaughtView.jsx';
import { CalendarView } from './views/CalendarView.jsx';
import { TriageView } from './views/TriageView.jsx';
import { DeliverableView } from './views/DeliverableView.jsx';
import { OutboxView } from './views/OutboxView.jsx';

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'caught', label: 'Caught for you' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'inbox', label: 'Inbox triage' },
  { key: 'davr-kit', label: 'Davr call kit' },
  { key: 'one-pager', label: 'Q3 one-pager' },
  { key: 'press', label: 'Press response' },
  { key: 'briefing', label: 'Audio briefing' },
  { key: 'outbox', label: 'Outbox' },
];

const DELIVERABLES = new Set(['davr-kit', 'one-pager', 'press', 'briefing']);

export const App = () => {
  const [asOf, setAsOf] = useState('16:10');
  const [tab, setTab] = useState('today');
  const [version, setVersion] = useState(0);
  const today = useApi(`/today?asOf=${asOf}&v=${version}`);
  const refresh = () => setVersion((value) => value + 1);

  const badges = today.data ? {
    today: today.data.counts.needsYou,
    caught: today.data.counts.findings,
  } : {};

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <h1>StandIn</h1>
            <p>AI chief of staff · ABB Super Bank · the CEO’s assistant is out today</p>
          </div>
        </div>
        <ClockBar asOf={asOf} onChange={setAsOf} mode={today.data?.mode} />
      </header>
      <Tabs tabs={TABS} active={tab} onSelect={setTab} badges={badges} />
      <main className="content">
        {today.error && <div className="error">Could not load the day: {today.error}</div>}
        {today.loading && !today.data && <div className="muted">Reading the scenario files…</div>}
        {today.data && tab === 'today' && <TodayView today={today.data} onOpen={setTab} />}
        {today.data && tab === 'caught' && <CaughtView findings={today.data.findings} />}
        {today.data && tab === 'calendar' && <CalendarView calendar={today.data.calendar} />}
        {today.data && tab === 'inbox' && <TriageView triage={today.data.triage} labels={today.data.categoryLabels} counts={today.data.counts} />}
        {DELIVERABLES.has(tab) && <DeliverableView key={`${tab}-${asOf}-${version}`} type={tab} asOf={asOf} onDecided={refresh} />}
        {tab === 'outbox' && <OutboxView version={version} onReset={refresh} />}
      </main>
    </div>
  );
};
