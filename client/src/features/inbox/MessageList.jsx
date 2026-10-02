import { Avatar } from '../../components/Avatar.jsx';
import { CategoryBadge, ChannelIcon, PriorityBadge, Tag } from '../../components/Badges.jsx';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { formatTime } from '../../lib/format.js';

export const MessageList = ({ messages, selectedId, onSelect, showChannel }) => {
  const { timeZone } = useSettings();
  return (
    <ul className="message-list">
      {messages.map((message) => (
        <li key={message.id}>
          <button
            className={`message-row ${message.id === selectedId ? 'is-selected' : ''} ${message.status === 'new' ? 'is-unread' : ''} message-row--${message.classification.priority}`}
            onClick={() => onSelect(message)}
          >
            <Avatar name={message.from.name} size={32} />
            <span className="message-row__main">
              <span className="message-row__top">
                <strong className="message-row__from">{message.from.name}</strong>
                {showChannel && <ChannelIcon channel={message.channel} />}
                {message.conversationName && <span className="muted small">{message.conversationName}</span>}
                <span className="message-row__time">{formatTime(message.receivedAt, timeZone)}</span>
              </span>
              {message.subject && <span className="message-row__subject">{message.subject}</span>}
              <span className="message-row__preview">{message.body}</span>
              <span className="message-row__meta">
                <PriorityBadge priority={message.classification.priority} />
                <CategoryBadge category={message.classification.category} />
                {message.classification.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                {message.draft && <span className="tag tag--accent">Draft</span>}
                {message.replies.length > 0 && <span className="tag tag--ok">Replied</span>}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};
