import { DEFAULT_MEETING_PRIORITY, MEETING_PRIORITY_RULES } from '../config/meetingPriority.js';

export class MeetingPrioritizer {
  constructor(rules = MEETING_PRIORITY_RULES) {
    this.rules = rules;
  }

  score(meeting) {
    return this.rules.find((rule) => rule.pattern.test(meeting.title))?.score ?? DEFAULT_MEETING_PRIORITY;
  }
}
