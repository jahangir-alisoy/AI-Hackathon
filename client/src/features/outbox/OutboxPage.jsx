import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Send } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { ChannelIcon, PriorityBadge } from '../../components/Badges.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { formatRelative, formatTime } from '../../lib/format.js';

export const OutboxPage = () => {
  const { timeZone } = useSettings();
  const navigate = useNavigate();
  const [tab, setTab] = useState('sent');
  const messages = useResource('/messages?status=', { refreshOn: ['message.', 'messages.'] });
  const activity = useResource('/overview/activity', { refreshOn: ['activity.'] });
  const all = messages.data ?? [];
  const drafts = all.filter((message) => message.draft);
  const sent = all.flatMap((message) => message.replies.map((reply) => ({ ...reply, message }))).sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const open = (message) => navigate(`/inbox/${message.channel}/${message.id}`);

  return (
    <div className="page">
      <PageHeader title="Sent" />
      <Segmented
        label="Show"
        value={tab}
        onChange={setTab}
        options={[{ value: 'sent', label: 'Sent' }, { value: 'drafts', label: `Drafts${drafts.length ? ` (${drafts.length})` : ''}` }, { value: 'activity', label: 'Activity' }]}
      />
      {tab === 'drafts' && (
        drafts.length === 0
          ? <EmptyState icon={FileText} title="No drafts" text="Open a message and press “Draft reply”." />
          : <ul className="stack-list">
              {drafts.map((message) => (
                <li key={message.id}>
                  <button className="stack-row" onClick={() => open(message)}>
                    <ChannelIcon channel={message.channel} />
                    <span className="stack-row__main">
                      <strong>To {message.from.name}</strong>
                      <span className="muted small">Re: {message.subject || message.body.slice(0, 70)}</span>
                      <span className="stack-row__text">{message.draft.text}</span>
                    </span>
                    <PriorityBadge priority={message.classification.priority} />
                  </button>
                </li>
              ))}
            </ul>
      )}
      {tab === 'sent' && (
        sent.length === 0
          ? <EmptyState icon={Send} title="Nothing sent yet" />
          : <ul className="stack-list">
              {sent.map((reply) => (
                <li key={`${reply.message.id}-${reply.id}`}>
                  <button className="stack-row" onClick={() => open(reply.message)}>
                    <ChannelIcon channel={reply.message.channel} />
                    <span className="stack-row__main">
                      <strong>To {reply.message.from.name}{reply.auto && <span className="tag tag--accent">Auto-reply</span>}</strong>
                      <span className="stack-row__text">{reply.text}</span>
                      <span className="muted small">{formatTime(reply.sentAt, timeZone)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
      )}
      {tab === 'activity' && (
        <ul className="activity activity--full">
          {activity.data?.map((entry) => (
            <li key={entry.id} className={`activity__item activity__item--${entry.type}`}>
              <span>{entry.text}</span>
              <span className="muted small">{formatRelative(entry.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
