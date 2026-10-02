import { eventText } from '../../shared/text.js';
import { fromMeridiem, minutesBetween, toMinutes } from '../../shared/time.js';

const DUE = /\b(ideally before|before|by|deadline is)\s+(~?)(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi;
const BY_DAY = /\bby (monday|tuesday|wednesday|thursday|friday|end of week)\b/i;
const DEFAULT_ACTION = /\b(?:send|sending|go out|goes out)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s+unless\b/i;
const IGNORED = new Set(['SECURITY_RISK', 'NOISE']);

export class DeadlineRadar {
  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  build({ events, triageById, calendarDeadlines, resolutions, approvedTopics, asOf }) {
    const mentions = [...this.fromEvents(events, triageById), ...this.fromCalendar(calendarDeadlines)];
    const byTopic = new Map();
    for (const mention of mentions) byTopic.set(mention.topic, [...(byTopic.get(mention.topic) ?? []), mention]);
    const deadlines = [...byTopic.entries()].map(([topic, list]) =>
      this.summarize(topic, list, { resolutions, approvedTopics, asOf }));
    const defaultActions = this.defaultActions(events, deadlines);
    return {
      deadlines: deadlines.sort((a, b) => this.sortKey(a) - this.sortKey(b)),
      defaultActions,
    };
  }

  fromEvents(events, triageById) {
    return events
      .filter((event) => event.topics.length && !IGNORED.has(triageById.get(event.id)?.category))
      .flatMap((event) => {
        const text = eventText(event);
        const timed = [...text.matchAll(DUE)].map((match) => ({
          topic: event.topics[0],
          due: fromMeridiem(match[3], match[4], match[5]),
          soft: /ideally/i.test(match[1]) || match[2] === '~',
          source: event.ref,
        }));
        const day = text.match(BY_DAY);
        const daily = day ? [{ topic: event.topics[0], due: null, dayLabel: day[1], soft: false, source: event.ref }] : [];
        return [...timed, ...daily];
      });
  }

  fromCalendar(calendarDeadlines) {
    return calendarDeadlines.flatMap((entry) => {
      const topics = this.topicClassifier.classify(`${entry.title} ${entry.notes}`);
      return topics.length ? [{ topic: topics[0], due: entry.start, soft: false, source: entry.ref }] : [];
    });
  }

  summarize(topic, mentions, { resolutions, approvedTopics, asOf }) {
    const earliest = (list) => list.map((mention) => mention.due).filter(Boolean).sort((a, b) => toMinutes(a) - toMinutes(b))[0] ?? null;
    const hard = earliest(mentions.filter((mention) => !mention.soft));
    const soft = earliest(mentions.filter((mention) => mention.soft));
    const dayLabel = mentions.find((mention) => mention.dayLabel)?.dayLabel ?? null;
    const minutesLeft = hard ? minutesBetween(asOf, hard) : null;
    return {
      topic,
      label: this.topicClassifier.get(topic).label,
      due: hard,
      softDue: soft,
      dayLabel,
      minutesLeft,
      status: this.status({ topic, hard, minutesLeft, resolutions, approvedTopics }),
      sources: [...new Set(mentions.map((mention) => mention.source))],
    };
  }

  status({ topic, hard, minutesLeft, resolutions, approvedTopics }) {
    if (approvedTopics.has(topic)) return 'done';
    if (resolutions.has(topic)) return 'resolved';
    if (!hard) return 'later';
    if (minutesLeft < 0) return 'missed';
    if (minutesLeft <= 60) return 'urgent';
    return 'open';
  }

  defaultActions(events, deadlines) {
    return events.flatMap((event) => {
      const match = eventText(event).match(DEFAULT_ACTION);
      if (!match || !event.topics.length) return [];
      const at = fromMeridiem(match[1], match[2], match[3]);
      const deadline = deadlines.find((candidate) => candidate.topic === event.topics[0]);
      const lateBy = deadline?.due ? minutesBetween(deadline.due, at) : null;
      return [{
        topic: event.topics[0],
        at,
        actor: event.actor,
        source: event.ref,
        summary: event.subject || event.body,
        deadline: deadline?.due ?? null,
        lateBy: lateBy > 0 ? lateBy : null,
      }];
    });
  }

  sortKey(deadline) {
    if (deadline.due) return toMinutes(deadline.due);
    return deadline.dayLabel ? 10_000 : 20_000;
  }
}
