import { ChannelIcon } from '../../components/Badges.jsx';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { formatTime } from '../../lib/format.js';

export const MessageList = ({ messages, selectedId, onSelect, showChannel }) => {
  const { timeZone } = useSettings();
  return (
    <ul className="message-list">
      {messages.map((message) => (
        <li key={message.id}>
          <button
            className={`message-row ${message.id === selectedId ? 'is-selected' : ''} ${message.status === 'new' ? 'is-unread' : ''}`}
            onClick={() => onSelect(message)}
          >
            <span className={`dot dot--${message.classification.priority}`} aria-label={`${message.classification.priority} priority`} />
            <span className="message-row__main">
              <span className="message-row__top">
                <strong className="message-row__from">{message.from.name}</strong>
                {showChannel && <ChannelIcon channel={message.channel} size={12} />}
                <span className="message-row__time">{formatTime(message.receivedAt, timeZone)}</span>
              </span>
              <span className="message-row__preview">{message.subject || message.body}</span>
            </span>
            {message.replies.length > 0 && <span className="message-row__flag">Replied</span>}
            {!message.replies.length && message.draft && <span className="message-row__flag message-row__flag--draft">Draft</span>}
          </button>
        </li>
      ))}
    </ul>
  );
};
