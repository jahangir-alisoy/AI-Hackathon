export class DeadlineConflictFinding {
  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  detect({ defaultActions, schedule }) {
    const lateDefaults = defaultActions.filter((action) => action.lateBy).map((action) => ({
      kind: 'deadline-conflict',
      severity: 'high',
      title: `${this.topicClassifier.get(action.topic).label}: default plan misses the deadline`,
      detail: `${action.actor} will act at ${action.at} unless you object, but the deadline is ${action.deadline} — ${action.lateBy} min too late. Decide before ${action.deadline}.`,
      sources: [action.source],
    }));
    const lateMeetings = schedule.lateMeetings.map((late) => ({
      kind: 'deadline-conflict',
      severity: 'high',
      title: `"${late.meeting.title}" is after its deadline`,
      detail: late.suggestion,
      sources: late.sources,
    }));
    return [...lateDefaults, ...lateMeetings];
  }
}
