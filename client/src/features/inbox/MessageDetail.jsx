import { Archive, ArrowLeft, Check, MailOpen, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { Avatar } from '../../components/Avatar.jsx';
import { Button } from '../../components/Button.jsx';
import { ChannelBadge } from '../../components/Badges.jsx';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useToast } from '../../lib/ToastContext.jsx';
import { formatDay, formatTime } from '../../lib/format.js';
import { ClassificationCard } from './ClassificationCard.jsx';
import { ReplyComposer } from './ReplyComposer.jsx';

export const MessageDetail = ({ id, onBack, onDeleted }) => {
  const { settings, timeZone } = useSettings();
  const notify = useToast();
  const resource = useResource(`/messages/${id}`, { refreshOn: ['message.updated', 'messages.'] });
  const message = resource.data;

  useEffect(() => {
    if (message?.status === 'new') api.patch(`/messages/${id}`, { status: 'read' }).then(resource.setData).catch(() => null);
  }, [id, message?.status]);

  if (resource.error) return <p className="form__error">{resource.error}</p>;
  if (!message) return <p className="muted">Loading…</p>;

  const update = async (patch) => {
    try {
      resource.setData(await api.patch(`/messages/${id}`, patch));
    } catch (error) {
      notify({ tone: 'urgent', title: 'Could not update', text: error.message });
    }
  };
  const remove = async () => {
    if (!window.confirm('Delete this message from StandIn?')) return;
    await api.delete(`/messages/${id}`);
    onDeleted();
  };
  const reclassify = async () => resource.setData(await api.post(`/messages/${id}/reclassify`, { useAi: true }));
  const claudeReady = Boolean(settings?.integrations?.claude?.connected && settings?.ai?.useClaude);

  return (
    <article className="detail">
      <header className="detail__toolbar">
        <Button variant="ghost" size="sm" icon={ArrowLeft} className="detail__back" onClick={onBack}>Back</Button>
        <div className="detail__toolbar-actions">
          {message.status !== 'done'
            ? <Button size="sm" icon={Check} onClick={() => update({ status: 'done' })}>Mark done</Button>
            : <Button size="sm" icon={MailOpen} onClick={() => update({ status: 'read' })}>Reopen</Button>}
          <Button size="sm" variant="ghost" icon={Archive} onClick={() => update({ status: 'archived' })}>Archive</Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={remove} aria-label="Delete" />
        </div>
      </header>

      <div className="detail__head">
        <Avatar name={message.from.name} size={42} />
        <div>
          <div className="detail__from">
            <strong>{message.from.name}</strong>
            {message.from.title && <span className="muted"> · {message.from.title}</span>}
          </div>
          <div className="muted small">
            {message.from.handle && <>{message.from.handle} · </>}
            {formatDay(message.receivedAt, timeZone)}, {formatTime(message.receivedAt, timeZone)}
            {message.conversationName && <> · {message.conversationName}</>}
          </div>
        </div>
        <ChannelBadge channel={message.channel} />
      </div>

      {message.subject && <h2 className="detail__subject">{message.subject}</h2>}
      <p className="detail__body">{message.body}</p>

      <ClassificationCard message={message} onOverride={(override) => update({ override: override && (override.priority || override.category) ? override : null })} onReclassify={reclassify} claudeReady={claudeReady} />

      {message.replies.length > 0 && (
        <section className="thread">
          {message.replies.map((reply) => (
            <div key={reply.id} className="thread__reply">
              <div className="thread__meta">
                <strong>{reply.auto ? `Auto-reply · ${reply.templateName}` : 'You'}</strong>
                <span className="muted small">{formatTime(reply.sentAt, timeZone)} · {reply.delivery === 'slack-api' ? 'delivered to Slack' : 'simulated delivery'}</span>
              </div>
              <p>{reply.text}</p>
            </div>
          ))}
        </section>
      )}

      {message.channel !== 'system' && <ReplyComposer message={message} onChange={resource.setData} />}
    </article>
  );
};
