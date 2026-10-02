import { WORKDAY } from '../config/meetingPriority.js';
import { fromMinutes, toMinutes } from '../../shared/time.js';

const firstOtherAttendee = (meeting) =>
  meeting.attendees.find((name) => name !== 'CEO')?.replace(/\s*\(.*\)$/, '') ?? 'the team';

export class ScheduleAdvisor {
  constructor({ prioritizer, topicClassifier }) {
    this.prioritizer = prioritizer;
    this.topicClassifier = topicClassifier;
  }

  advise({ calendar, resolutions, needsYou, deadlines, asOf }) {
    return {
      overlaps: this.uniqueBySuggestion(calendar.overlaps.map((overlap) => this.adviseOverlap(overlap))),
      shortenings: this.shortenResolved(calendar.meetings, resolutions),
      lateMeetings: this.meetingsAfterDeadline(calendar.meetings, deadlines),
      piggybacks: this.piggybacks(calendar.meetings, needsYou, asOf),
      gaps: this.gaps(calendar.meetings, needsYou).filter((gap) => toMinutes(gap.end) > toMinutes(asOf)),
    };
  }

  adviseOverlap({ first, second, minutes }) {
    const [high, low] = this.prioritizer.score(second) > this.prioritizer.score(first) ? [second, first] : [first, second];
    const lowScore = this.prioritizer.score(low);
    const suggestion = lowScore <= 2
      ? `Delegate "${low.title}" to ${firstOtherAttendee(low)}; send your input async.`
      : low === second
        ? `Join "${low.title}" at ${high.end} (${minutes} min late); ${firstOtherAttendee(low)} starts without you.`
        : `Leave "${low.title}" at ${high.start} (${minutes} min early); ${firstOtherAttendee(low)} wraps up.`;
    return {
      first: this.brief(first),
      second: this.brief(second),
      minutes,
      keep: high.title,
      adjust: low.title,
      suggestion,
      sources: [first.ref, second.ref],
    };
  }

  shortenResolved(meetings, resolutions) {
    return meetings.flatMap((meeting) => {
      const topic = this.topicClassifier.classify(`${meeting.title} ${meeting.notes}`).find((key) => resolutions.has(key));
      if (!topic) return [];
      const event = resolutions.get(topic);
      if (toMinutes(meeting.start) < toMinutes(event.time)) return [];
      return [{
        meeting: this.brief(meeting),
        suggestion: `"${meeting.title}" can be cut to 10 min — already resolved: ${event.subject || event.body}`,
        sources: [meeting.ref, event.ref],
      }];
    });
  }

  meetingsAfterDeadline(meetings, deadlines) {
    return meetings.flatMap((meeting) => {
      if (!/sync|prep|review/i.test(meeting.title)) return [];
      const topic = this.topicClassifier.classify(`${meeting.title} ${meeting.notes}`)[0];
      const deadline = deadlines.find((candidate) => candidate.topic === topic && candidate.due);
      if (!deadline || toMinutes(meeting.start) < toMinutes(deadline.due)) return [];
      return [{
        meeting: this.brief(meeting),
        topic,
        deadline: deadline.due,
        suggestion: `"${meeting.title}" starts at ${meeting.start}, after the ${deadline.due} deadline — decide earlier.`,
        sources: [meeting.ref, ...deadline.sources],
      }];
    });
  }

  piggybacks(meetings, needsYou, asOf) {
    const upcoming = meetings.filter((meeting) => toMinutes(meeting.start) >= toMinutes(asOf));
    return needsYou.flatMap((card) => card.askedBy.flatMap((person) => {
      const meeting = upcoming.find((candidate) => candidate.attendees.some((name) => name.startsWith(person)));
      return meeting ? [{
        topic: card.topic,
        person,
        meeting: this.brief(meeting),
        suggestion: `${person} is in "${meeting.title}" at ${meeting.start} — close "${card.label}" there.`,
      }] : [];
    }));
  }

  gaps(meetings, needsYou) {
    const gaps = [];
    let cursor = toMinutes(WORKDAY.start);
    for (const meeting of meetings) {
      const start = toMinutes(meeting.start);
      if (start - cursor >= 10) gaps.push({ start: fromMinutes(cursor), end: meeting.start, minutes: start - cursor });
      cursor = Math.max(cursor, toMinutes(meeting.end));
    }
    if (toMinutes(WORKDAY.end) - cursor >= 10) {
      gaps.push({ start: fromMinutes(cursor), end: WORKDAY.end, minutes: toMinutes(WORKDAY.end) - cursor });
    }
    return gaps.map((gap) => ({ ...gap, useFor: this.useFor(gap, needsYou) }));
  }

  useFor(gap, needsYou) {
    const candidates = needsYou.filter((card) => !card.deadline?.due || toMinutes(card.deadline.due) >= toMinutes(gap.end) || card.deadline.status === 'missed');
    return candidates.slice(0, 2).map((card) => card.label);
  }

  uniqueBySuggestion(advice) {
    const seen = new Set();
    return advice.map((item) => {
      const repeated = seen.has(item.suggestion);
      seen.add(item.suggestion);
      return repeated ? { ...item, suggestion: `Covered above: ${item.adjust}` } : item;
    });
  }

  brief(meeting) {
    return { id: meeting.id, title: meeting.title, start: meeting.start, end: meeting.end };
  }
}
