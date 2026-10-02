export class ResolvedRiskFinding {
  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  detect({ resolutions, facts }) {
    return [...resolutions.entries()].map(([topic, event]) => {
      const stale = facts.filter((fact) => fact.topics.includes(topic));
      return {
        kind: 'resolved',
        severity: 'medium',
        title: `${this.topicClassifier.get(topic).label} is resolved`,
        detail: `${event.actor} at ${event.time}: "${event.subject || event.body}".${stale.length ? ` The quarter notes still list it as a risk: "${stale[0].text}" — updated in the one-pager.` : ''}`,
        sources: [event.ref, ...stale.map((fact) => fact.ref)],
      };
    });
  }
}
