import { fromMeridiem, toMinutes } from '../../../shared/time.js';

const DUE = /\b(?:ideally before|before|by|deadline is|due)\s+~?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const URGENT_WITHIN_MINUTES = 180;

export class DeadlineDetector {
  detect(message) {
    const match = `${message.subject} ${message.body}`.match(DUE);
    if (!match) return null;
    const deadline = fromMeridiem(match[1], match[2], match[3]);
    const received = new Date(message.receivedAt);
    const minutesLeft = toMinutes(deadline) - (received.getHours() * 60 + received.getMinutes());
    const priority = minutesLeft <= URGENT_WITHIN_MINUTES ? 'urgent' : 'high';
    return { priority, category: null, reason: `Deadline ${deadline} (${minutesLeft >= 0 ? `${minutesLeft} min after it arrived` : 'already passed when it arrived'})`, deadline };
  }
}
