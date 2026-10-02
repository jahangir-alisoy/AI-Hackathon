const LABELS = {
  missed: 'Deadline passed',
  urgent: 'Due within the hour',
  open: 'Open',
  done: 'Done',
  resolved: 'Resolved',
  later: 'Later',
  VERIFY: 'Verify',
  UPDATED: 'Updated',
  CURRENT: 'Current',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{LABELS[status] ?? status}</span>;
