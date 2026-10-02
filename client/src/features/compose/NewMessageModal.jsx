import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Hash, Mail } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';
import { Field, Input, Textarea } from '../../components/Fields.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { api } from '../../lib/api.js';

const CHANNEL_OPTIONS = [
  { value: 'slack', label: 'Slack', icon: Hash },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'system', label: 'System', icon: Bell },
];

const ENDPOINTS = { slack: '/integrations/slack/simulate', email: '/integrations/email/inbound', system: '/integrations/system' };

const EXAMPLES = {
  slack: { name: 'Bekzod Nazarov', handle: '', conversation: 'Direct message', subject: '', body: 'Hi, our legal team asks whether the Davr Bank DSA is signed. Can you confirm by 3pm?' },
  email: { name: 'Sam Reyes', handle: 'sam.reyes@techinsight.example', conversation: '', subject: 'Follow-up on layoffs story', body: 'Hi — following up on my earlier request. Can you confirm or deny before 4pm?' },
  system: { name: 'IT Monitoring', handle: '', conversation: 'Laptop', subject: 'Disk almost full', body: 'Your laptop disk is 92% full.' },
};

export const NewMessageModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [channel, setChannel] = useState('slack');
  const [form, setForm] = useState(EXAMPLES.slack);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const switchChannel = (next) => {
    setChannel(next);
    setForm(EXAMPLES[next]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const message = await api.post(ENDPOINTS[channel], {
        from: { name: form.name, handle: form.handle || undefined },
        conversationName: form.conversation || undefined,
        conversationId: channel === 'slack' && /^[CDG][A-Z0-9]{6,}$/.test(form.conversation) ? form.conversation : undefined,
        subject: form.subject || undefined,
        body: form.body,
      });
      onClose();
      navigate(`/inbox/${channel}/${message.id}`);
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Simulate an incoming message"
      onClose={onClose}
      footer={(
        <>
          <span className="muted small">It goes through the same pipeline as a real Slack event or email.</span>
          <Button variant="primary" type="submit" form="compose-form" disabled={busy}>{busy ? 'Classifying…' : 'Receive message'}</Button>
        </>
      )}
    >
      <form id="compose-form" className="form" onSubmit={submit}>
        <Segmented label="Channel" options={CHANNEL_OPTIONS} value={channel} onChange={switchChannel} />
        <div className="form__row">
          <Field label="From"><Input value={form.name} onChange={set('name')} required /></Field>
          <Field label={channel === 'slack' ? 'Slack user ID (optional)' : channel === 'email' ? 'Email address' : 'Device or app'} hint={channel === 'slack' ? 'With a bot token, replies go to this user (e.g. U012AB3CD)' : undefined}>
            <Input value={channel === 'system' ? form.conversation : form.handle} onChange={channel === 'system' ? set('conversation') : set('handle')} />
          </Field>
        </div>
        {channel === 'slack' && (
          <Field label="Slack conversation" hint="A channel ID like C0123ABCD replies in that channel when Slack is connected">
            <Input value={form.conversation} onChange={set('conversation')} />
          </Field>
        )}
        {channel !== 'slack' && <Field label="Subject"><Input value={form.subject} onChange={set('subject')} /></Field>}
        <Field label="Message"><Textarea rows={5} value={form.body} onChange={set('body')} required /></Field>
        {error && <p className="form__error">{error}</p>}
      </form>
    </Modal>
  );
};
