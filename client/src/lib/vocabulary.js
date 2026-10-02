import { AlertTriangle, Bell, CalendarDays, Hash, Mail } from 'lucide-react';

export const PRIORITIES = ['urgent', 'high', 'normal', 'low'];
export const CATEGORIES = ['Decision', 'Approval', 'Scheduling', 'FYI', 'Later', 'Noise', 'Fraud'];

export const PRIORITY_LABELS = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' };

export const CHANNELS = {
  slack: { label: 'Slack', icon: Hash },
  email: { label: 'Email', icon: Mail },
  system: { label: 'System', icon: Bell },
  events: { label: 'Events', icon: CalendarDays },
};

export const CATEGORY_ICONS = { Fraud: AlertTriangle };

export const REASON_LABELS = { detector: 'Function', rule: 'Your rule', vip: 'VIP', ai: 'Claude', ceo: 'You' };
