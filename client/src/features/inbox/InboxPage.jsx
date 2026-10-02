import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Inbox, Search } from 'lucide-react';
import { useResource } from '../../lib/useResource.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Select } from '../../components/Fields.jsx';
import { MessageList } from './MessageList.jsx';
import { MessageDetail } from './MessageDetail.jsx';

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'slack', label: 'Slack' },
  { value: 'email', label: 'Email' },
  { value: 'system', label: 'System' },
];

const VIEWS = [
  { value: 'active', label: 'Open' },
  { value: 'important', label: 'Urgent & high' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
];

const buildQuery = ({ channel, view, q }) => {
  const params = new URLSearchParams();
  if (channel !== 'all') params.set('channel', channel);
  if (view === 'done' || view === 'archived') params.set('status', view);
  if (q) params.set('q', q);
  return `/messages?${params}`;
};

const IMPORTANT = new Set(['urgent', 'high']);

export const InboxPage = () => {
  const { channel = 'all', messageId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('active');
  const [query, setQuery] = useState('');
  const messages = useResource(buildQuery({ channel, view, q: query }), { refreshOn: ['message.', 'messages.'] });
  const list = useMemo(() => {
    const all = messages.data ?? [];
    if (view === 'active') return all.filter((message) => message.status !== 'done');
    if (view === 'important') return all.filter((message) => message.status !== 'done' && IMPORTANT.has(message.classification.priority));
    return all;
  }, [messages.data, view]);

  return (
    <div className={`inbox ${messageId ? 'inbox--detail' : ''}`}>
      <section className="inbox__list">
        <header className="inbox__header">
          <div className="inbox__title-row">
            <h1 className="page-title">Inbox</h1>
            <Select aria-label="Show" value={view} onChange={(event) => setView(event.target.value)} options={VIEWS} className="input input--select input--compact" />
          </div>
          <Segmented label="Channel" options={CHANNEL_OPTIONS} value={channel} onChange={(value) => navigate(`/inbox/${value}`)} />
          <div className="search">
            <Search size={15} aria-hidden="true" />
            <input placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search messages" />
          </div>
        </header>
        {messages.data && list.length === 0
          ? <EmptyState icon={Inbox} title="Nothing here" />
          : <MessageList messages={list} selectedId={messageId} onSelect={(message) => navigate(`/inbox/${channel}/${message.id}`)} showChannel={channel === 'all'} />}
      </section>
      <section className="inbox__detail">
        {messageId
          ? <MessageDetail key={messageId} id={messageId} onBack={() => navigate(`/inbox/${channel}`)} onDeleted={() => navigate(`/inbox/${channel}`)} />
          : <EmptyState icon={Inbox} title="Select a message" />}
      </section>
    </div>
  );
};
