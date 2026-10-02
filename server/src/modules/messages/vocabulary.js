export const CHANNELS = ['slack', 'email', 'system'];
export const PRIORITIES = ['urgent', 'high', 'normal', 'low'];
export const CATEGORIES = ['Decision', 'Approval', 'Scheduling', 'FYI', 'Later', 'Noise', 'Fraud'];
export const STATUSES = ['new', 'read', 'done', 'archived'];

export const PRIORITY_RANK = { low: 0, normal: 1, high: 2, urgent: 3 };

export const higherPriority = (a, b) => (PRIORITY_RANK[a] >= PRIORITY_RANK[b] ? a : b);

export const raisePriority = (priority, ceiling = 'urgent') =>
  PRIORITY_RANK[priority] >= PRIORITY_RANK[ceiling] ? priority : PRIORITIES[PRIORITIES.indexOf(priority) - 1];
