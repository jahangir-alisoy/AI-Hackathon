import { eventText } from '../../shared/text.js';

const CORRECTION = /\b(correction|corrected|shifted|wrong|don't reference|do not reference)\b/i;
const VERSION = /\bv(\d+)\b/gi;

export class CorrectionTracker {
  track(events) {
    return events
      .filter((event) => CORRECTION.test(eventText(event)))
      .map((event) => ({ event, topics: event.topics, ...this.versions(eventText(event)) }));
  }

  versions(text) {
    const numbers = [...new Set([...text.matchAll(VERSION)].map((match) => Number(match[1])))];
    if (numbers.length < 2) return { current: null, superseded: [] };
    const current = Math.max(...numbers);
    return { current: `v${current}`, superseded: numbers.filter((n) => n !== current).map((n) => `v${n}`) };
  }
}
