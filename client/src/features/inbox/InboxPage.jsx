import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Inbox, Search } from 'lucide-react';
import { useResource } from '../../lib/useResource.js';
import { CHANNELS, PRIORITIES, PRIORITY_LABELS } from '../../lib/vocabulary.js';
import { EmptyState } from '../../components/EmptyState.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { MessageList } from './MessageList.jsx';
import { MessageDetail } from './MessageDetail.jsx';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
];

const buildQuery = ({ channel, status, priority, q }) => {
  const params = new URLSearchParams();
  if (channel !== 'all') params.set('channel', channel);
  if (status !== 'active') params.set('status', status);
  if (priority) params.set('priority', priority);
  if (q) params.set('q', q);
  return `/messages?${params}`;
};

export const InboxPage = () => {
  const { channel = 'all', messageId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('');
  const [query, setQuery] = useState('');
  const path = buildQuery({ channel, status, priority, q: query });
  const messages = useResource(path, { refreshOn: ['message.', 'messages.'] });
  const list = useMemo(() => (status === 'active' ? (messages.data ?? []).filter((message) => message.status !== 'done') : messages.data ?? []), [messages.data, status]);
  const title = channel === 'all' ? 'All messages' : CHANNELS[channel]?.label ?? channel;

  return (
    <div className={`inbox ${messageId ? 'inbox--detail' : ''}`}>
      <section className="inbox__list">
        <header className="inbox__header">
          <h1 className="page-title">{title}</h1>
          <div className="search">
            <Search size={15} aria-hidden="true" />
            <input placeholder="Search people, subjects, text" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search messages" />
          </div>
          <div className="inbox__filters">
            <Segmented label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            <div className="priority-filter" role="group" aria-label="Priority">
              {PRIORITIES.map((value) => (
                <button key={value} className={`pill pill--${value} ${priority === value ? 'is-active' : ''}`} onClick={() => setPriority(priority === value ? '' : value)}>
                  {PRIORITY_LABELS[value]}
                </button>
              ))}
            </div>
          </div>
        </header>
        {messages.data && list.length === 0
          ? <EmptyState icon={Inbox} title="Nothing here" text="Try another filter, or simulate an incoming message." />
          : <MessageList messages={list} selectedId={messageId} onSelect={(message) => navigate(`/inbox/${channel}/${message.id}`)} showChannel={channel === 'all'} />}
      </section>
      <section className="inbox__detail">
        {messageId
          ? <MessageDetail key={messageId} id={messageId} onBack={() => navigate(`/inbox/${channel}`)} onDeleted={() => navigate(`/inbox/${channel}`)} />
          : <EmptyState icon={Inbox} title="Select a message" text="StandIn shows why it ranked it, lets you correct it, and drafts the reply." />}
      </section>
    </div>
  );
};
