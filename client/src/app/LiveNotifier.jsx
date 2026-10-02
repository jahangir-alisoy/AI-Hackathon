import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeLive } from '../lib/live.js';
import { useToast } from '../lib/ToastContext.jsx';

const CHANNEL_LABEL = { slack: 'Slack', email: 'Email', system: 'Notification' };

export const LiveNotifier = () => {
  const notify = useToast();
  const navigate = useNavigate();

  useEffect(() => subscribeLive((event) => {
    if (event.type === 'message.created') {
      const message = event.payload;
      notify({
        tone: message.classification.priority,
        title: `${CHANNEL_LABEL[message.channel]} from ${message.from.name}`,
        text: `${message.classification.priority} · ${message.classification.category} — ${message.subject || message.body.slice(0, 80)}`,
        onClick: () => navigate(`/inbox/${message.channel}/${message.id}`),
      });
    }
    if (event.type === 'activity.created' && event.payload.type === 'auto-reply') {
      notify({ tone: 'success', title: 'Auto-reply sent', text: event.payload.text });
    }
  }), [notify, navigate]);

  return null;
};
