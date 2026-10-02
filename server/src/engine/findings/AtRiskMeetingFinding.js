import { toMinutes } from '../../domain/time.js';

export class AtRiskMeetingFinding {
  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  detect({ calendar, events }) {
    return calendar.meetings.filter((meeting) => /at risk/i.test(meeting.status)).flatMap((meeting) => {
      const topic = this.topicClassifier.classify(`${meeting.title} ${meeting.notes}`)[0];
      const cause = [...events].reverse().find((event) =>
        event.topics.includes(topic) && /\b(cancel\w*|unavailable|ill|sick)\b/i.test(`${event.subject} ${event.body}`) &&
        toMinutes(event.time) <= toMinutes(meeting.start));
      if (!cause) return [];
      return [{
        kind: 'at-risk',
        severity: 'high',
        title: `"${meeting.title}" at ${meeting.start} is at risk`,
        detail: `${cause.actor}: ${cause.subject || cause.body}. StandIn prepared a call kit with a proceed / reschedule decision.`,
        sources: [meeting.ref, cause.ref],
      }];
    });
  }
}
