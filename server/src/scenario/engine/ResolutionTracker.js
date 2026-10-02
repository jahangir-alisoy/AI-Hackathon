import { eventText } from '../../shared/text.js';

const RESOLVED = /\b(agreed to (?:stay|keep)|staying|has been signed|is now signed|is resolved)\b/i;

export class ResolutionTracker {
  track(events) {
    const resolutions = new Map();
    for (const event of events) {
      if (!RESOLVED.test(eventText(event))) continue;
      for (const topic of event.topics) {
        if (!resolutions.has(topic)) resolutions.set(topic, event);
      }
    }
    return resolutions;
  }
}
