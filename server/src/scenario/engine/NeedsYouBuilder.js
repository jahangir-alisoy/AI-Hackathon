import { toMinutes } from '../../shared/time.js';

const ACTIONABLE = new Set(['CEO_DECISION', 'APPROVE_DRAFT']);

export class NeedsYouBuilder {
  constructor(topicClassifier) {
    this.topicClassifier = topicClassifier;
  }

  build({ triage, deadlines, resolutions, approvedTopics }) {
    const groups = new Map();
    for (const item of triage.filter((entry) => ACTIONABLE.has(entry.category))) {
      const topic = item.topics[0] ?? `other-${item.id}`;
      groups.set(topic, [...(groups.get(topic) ?? []), item]);
    }
    return [...groups.entries()]
      .map(([topic, asks]) => this.toCard(topic, asks, deadlines.find((deadline) => deadline.topic === topic)))
      .filter((card) => !resolutions.has(card.topic) && !approvedTopics.has(card.topic))
      .filter((card) => !this.isStale(card))
      .sort((a, b) => this.rank(a) - this.rank(b));
  }

  toCard(topic, asks, deadline) {
    const definition = this.topicClassifier.get(topic);
    const latest = asks[asks.length - 1];
    return {
      topic,
      label: definition.label === 'Other' ? latest.summary : definition.label,
      action: definition.action || latest.summary,
      deliverable: definition.deliverable ?? null,
      deadline: deadline ?? null,
      latestAt: latest.time,
      askedBy: [...new Set(asks.map((ask) => ask.actor))],
      nudges: asks.length,
      asks,
    };
  }

  isStale(card) {
    if (card.deadline?.status !== 'missed' || card.deliverable) return false;
    return toMinutes(card.latestAt) <= toMinutes(card.deadline.due);
  }

  rank(card) {
    if (card.deadline?.due) return toMinutes(card.deadline.due);
    return 5_000 - card.nudges;
  }
}
