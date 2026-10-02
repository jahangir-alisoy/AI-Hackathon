import { normalizeClock } from '../domain/time.js';
import { eventText } from '../domain/text.js';

const FROM_TO = /from (\d{1,2}:\d{2}) to (\d{1,2}:\d{2})/i;
const INSTEAD_OF = /to (\d{1,2}:\d{2}) instead of (\d{1,2}:\d{2})/i;
const TARGET_ONLY = /\b(?:push|pushing|pushed|move|moving|moved)\b.*?\bto (\d{1,2}:\d{2})/i;

export class ChangeIntentParser {
  parse(events) {
    return events.map((event) => this.parseOne(event)).filter(Boolean);
  }

  parseOne(event) {
    const text = eventText(event);
    const fromTo = text.match(FROM_TO);
    if (fromTo) return this.intent(event, fromTo[2], fromTo[1]);
    const insteadOf = text.match(INSTEAD_OF);
    if (insteadOf) return this.intent(event, insteadOf[1], insteadOf[2]);
    const targetOnly = text.match(TARGET_ONLY);
    if (targetOnly) return this.intent(event, targetOnly[1], null);
    return null;
  }

  intent(event, target, from) {
    return {
      event,
      requester: event.actor.split(' ')[0].toLowerCase(),
      target: normalizeClock(target),
      from: from ? normalizeClock(from) : null,
    };
  }
}
