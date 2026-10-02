export class CorrectionFinding {
  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  detect({ corrections, facts }) {
    const plain = corrections.filter((correction) => !correction.superseded.length && correction.topics.length);
    const byTopic = new Map();
    for (const correction of plain) {
      const topic = correction.topics.find((key) => key !== 'onepager') ?? correction.topics[0];
      byTopic.set(topic, [...(byTopic.get(topic) ?? []), correction]);
    }
    return [...byTopic.entries()].map(([topic, list]) => {
      const affected = facts.filter((fact) => fact.topics.includes(topic));
      return {
        kind: 'correction',
        severity: 'high',
        title: `${this.topicClassifier.get(topic).label}: numbers changed since this morning`,
        detail: `${list.map((correction) => `${correction.event.actor} (${correction.event.time}): ${correction.event.subject || correction.event.body}`).join(' · ')}. ${affected.length} line(s) in the one-pager are flagged VERIFY.`,
        sources: list.map((correction) => correction.event.ref),
      };
    });
  }
}
