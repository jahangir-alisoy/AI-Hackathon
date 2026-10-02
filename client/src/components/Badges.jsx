import { CHANNELS, PRIORITY_LABELS } from '../lib/vocabulary.js';

export const PriorityBadge = ({ priority }) => (
  <span className={`badge badge--${priority}`}>
    <span className="badge__dot" aria-hidden="true" />
    {PRIORITY_LABELS[priority] ?? priority}
  </span>
);

export const CategoryBadge = ({ category }) => <span className={`chip chip--${category.toLowerCase()}`}>{category}</span>;

export const ChannelIcon = ({ channel, size = 14 }) => {
  const Icon = CHANNELS[channel]?.icon;
  return Icon ? <span className={`channel-icon channel-icon--${channel}`}><Icon size={size} aria-hidden="true" /></span> : null;
};

export const ChannelBadge = ({ channel }) => (
  <span className={`channel-badge channel-badge--${channel}`}>
    <ChannelIcon channel={channel} size={12} />
    {CHANNELS[channel]?.label ?? channel}
  </span>
);

export const Tag = ({ children }) => <span className="tag">{children}</span>;
