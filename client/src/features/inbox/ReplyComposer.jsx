import { useEffect, useState } from 'react';
import { RefreshCw, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Input, Select, Textarea } from '../../components/Fields.jsx';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useToast } from '../../lib/ToastContext.jsx';

const DESTINATION = {
  slack: (message) => `Slack → ${message.conversationName || `@${message.from.name}`}`,
  email: (message) => `Email → ${message.from.handle ?? message.from.name}`,
};

export const ReplyComposer = ({ message, onChange }) => {
  const notify = useToast();
  const { settings } = useSettings();
  const templates = useResource('/templates', { refreshOn: ['templates.'] });
  const [text, setText] = useState(message.draft?.text ?? '');
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => setText(message.draft?.text ?? ''), [message.draft?.text]);

  const run = async (label, action) => {
    setBusy(label);
    try {
      const updated = await action();
      onChange(updated);
      return updated;
    } catch (error) {
      notify({ tone: 'urgent', title: 'Something went wrong', text: error.message });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const generate = () => run('generate', () => api.post(`/messages/${message.id}/draft`, { instruction }));
  const discard = () => run('discard', () => api.delete(`/messages/${message.id}/draft`)).then(() => setText(''));
  const send = async () => {
    const updated = await run('send', () => api.post(`/messages/${message.id}/send`, { text }));
    if (updated) {
      const reply = updated.replies.at(-1);
      notify({ tone: 'success', title: `Sent to ${message.from.name}`, text: reply.delivery === 'slack-api' ? 'Delivered to Slack' : reply.detail });
    }
  };
  const useTemplate = (id) => {
    const template = templates.data?.find((item) => item.id === id);
    if (!template) return;
    const firstName = message.from.name.split(' ')[0];
    setText(template.body
      .replaceAll('{{firstName}}', firstName)
      .replaceAll('{{sender}}', message.from.name)
      .replaceAll('{{ceoName}}', settings?.ceoName ?? '')
      .replaceAll('{{company}}', settings?.company ?? '')
      .replaceAll('{{subject}}', message.subject || 'your message'));
  };

  const usable = (templates.data ?? []).filter((template) => template.channel === 'any' || template.channel === message.channel);

  return (
    <section className="composer">
      <header className="composer__header">
        <strong>Reply</strong>
        <span className="composer__destination">{DESTINATION[message.channel]?.(message)}</span>
      </header>
      <Textarea rows={5} value={text} placeholder="Write a reply, pick a template, or let StandIn draft one." onChange={(event) => setText(event.target.value)} />
      {message.draft && (
        <p className="composer__meta">
          Draft v{message.draft.version} · {message.draft.generator === 'claude' ? 'written by Claude' : message.draft.generator === 'templates' ? 'written by templates' : 'edited by you'}
          {message.draft.note && <> · {message.draft.note}</>}
        </p>
      )}
      <div className="composer__ai">
        <Input placeholder="Optional instruction, e.g. “shorter, decline politely”" value={instruction} onChange={(event) => setInstruction(event.target.value)} />
        <Button icon={message.draft ? RefreshCw : Sparkles} onClick={generate} disabled={busy !== null}>
          {busy === 'generate' ? 'Drafting…' : message.draft ? 'Regenerate' : 'Draft reply'}
        </Button>
      </div>
      <div className="composer__actions">
        <Select
          aria-label="Insert template"
          value=""
          onChange={(event) => useTemplate(event.target.value)}
          options={[{ value: '', label: 'Insert template…' }, ...usable.map((template) => ({ value: template.id, label: template.name }))]}
        />
        {message.draft && <Button variant="ghost" icon={Trash2} onClick={discard} disabled={busy !== null}>Discard</Button>}
        <Button variant="primary" icon={Send} onClick={send} disabled={!text.trim() || busy !== null}>
          {busy === 'send' ? 'Sending…' : 'Approve & send'}
        </Button>
      </div>
    </section>
  );
};
