import { StatusBadge } from './StatusBadge.jsx';

const remaining = (minutes) => {
  if (minutes === null || minutes === undefined) return '';
  if (minutes < 0) return `${Math.abs(minutes)} min ago`;
  if (minutes < 60) return `${minutes} min left`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
};

export const DeadlineChip = ({ deadline }) => {
  if (!deadline) return <span className="muted small">No deadline</span>;
  const due = deadline.due ?? deadline.dayLabel;
  return (
    <span className="deadline-chip">
      <StatusBadge status={deadline.status} />
      <strong>{due}</strong>
      {deadline.softDue && <span className="muted small">ideally by {deadline.softDue}</span>}
      <span className="muted small">{remaining(deadline.minutesLeft)}</span>
    </span>
  );
};
