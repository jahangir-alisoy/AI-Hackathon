import { useEffect, useState } from 'react';
import { FileText, RefreshCw, Send, Sparkles, X } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Input, Textarea } from '../../components/Fields.jsx';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useToast } from '../../lib/ToastContext.jsx';

const fill = (body, message, settings) => body
  .replaceAll('{{firstName}}', message.from.name.split(' ')[0])
  .replaceAll('{{sender}}', message.from.name)
  .replaceAll('{{ceoName}}', settings?.ceoName ?? '')
  .replaceAll('{{company}}', settings?.company ?? '')
  .replaceAll('{{subject}}', message.subject || 'your message');

export const ReplyComposer = ({ message, onChange }) => {
  const notify = useToast();
  const { settings } = useSettings();
  const templates = useResource('/templates', { refreshOn: ['templates.'] });
  const [text, setText] = useState(message.draft?.text ?? '');
  const [instruction, setInstruction] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
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

  const generate = () => run('generate', () => api.post(`/messages/${message.id}/draft`, { instruction })).then(() => setInstruction(''));
  const send = async () => {
    const updated = await run('send', () => api.post(`/messages/${message.id}/send`, { text }));
    if (updated) notify({ tone: 'success', title: `Sent to ${message.from.name}` });
  };
  const usable = (templates.data ?? []).filter((template) => template.enabled && (template.channel === 'any' || template.channel === message.channel));

  return (
    <section className="composer">
      <Textarea
        rows={4}
        value={text}
        placeholder={`Reply to ${message.from.name.split(' ')[0]}…`}
        onChange={(event) => setText(event.target.value)}
      />
      {message.draft && (
        <div className="composer__tweak">
          <Input placeholder="Change something? e.g. shorter, more formal" value={instruction} onChange={(event) => setInstruction(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && generate()} />
        </div>
      )}
      {showTemplates && (
        <div className="template-picker">
          {usable.map((template) => (
            <button key={template.id} className="template-picker__item" onClick={() => { setText(fill(template.body, message, settings)); setShowTemplates(false); }}>
              {template.name}
            </button>
          ))}
          <button className="icon-btn" aria-label="Close templates" onClick={() => setShowTemplates(false)}><X size={14} /></button>
        </div>
      )}
      <div className="composer__actions">
        <button className="icon-btn" title="Templates" aria-label="Templates" onClick={() => setShowTemplates(!showTemplates)}><FileText size={17} /></button>
        <Button variant="ghost" icon={message.draft ? RefreshCw : Sparkles} onClick={generate} disabled={busy !== null}>
          {busy === 'generate' ? 'Writing…' : message.draft ? 'Rewrite' : 'Write with AI'}
        </Button>
        <span className="composer__spacer" />
        <Button variant="primary" icon={Send} onClick={send} disabled={!text.trim() || busy !== null}>
          {busy === 'send' ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </section>
  );
};
