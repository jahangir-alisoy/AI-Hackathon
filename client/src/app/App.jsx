import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from '../lib/SettingsContext.jsx';
import { ToastProvider } from '../lib/ToastContext.jsx';
import { Layout } from './Layout.jsx';
import { HomePage } from '../features/home/HomePage.jsx';
import { InboxPage } from '../features/inbox/InboxPage.jsx';
import { CalendarPage } from '../features/calendar/CalendarPage.jsx';
import { OutboxPage } from '../features/outbox/OutboxPage.jsx';
import { TrainLabPage } from '../features/lab/TrainLabPage.jsx';
import { BriefingsPage } from '../features/briefings/BriefingsPage.jsx';
import { SettingsPage } from '../features/settings/SettingsPage.jsx';

export const App = () => (
  <BrowserRouter>
    <SettingsProvider>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="inbox/:channel" element={<InboxPage />} />
            <Route path="inbox/:channel/:messageId" element={<InboxPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="outbox" element={<OutboxPage />} />
            <Route path="lab" element={<TrainLabPage />} />
            <Route path="briefings" element={<BriefingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </SettingsProvider>
  </BrowserRouter>
);
