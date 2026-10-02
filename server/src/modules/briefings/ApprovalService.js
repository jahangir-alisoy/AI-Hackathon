import { randomUUID } from 'node:crypto';
import { DELIVERABLE_TOPICS } from '../../scenario/config/topics.js';

const DECISIONS = new Set(['approved', 'rejected']);

export class ApprovalService {
  constructor(outboxRepository) {
    this.outboxRepository = outboxRepository;
  }

  decide(type, { decision, content, asOf }) {
    if (!DECISIONS.has(decision)) throw new RangeError(`decision must be one of: ${[...DECISIONS].join(', ')}`);
    if (typeof content !== 'string' || !content.trim()) throw new RangeError('content is required');
    return this.outboxRepository.add({
      id: randomUUID(),
      type,
      decision,
      content,
      asOf: asOf ?? null,
      decidedAt: new Date().toISOString(),
      status: decision === 'approved' ? 'queued in outbox (simulated — nothing is really sent)' : 'rejected by CEO',
    });
  }

  approvedTopics() {
    return new Set(this.outboxRepository.list()
      .filter((entry) => entry.decision === 'approved')
      .map((entry) => DELIVERABLE_TOPICS[entry.type])
      .filter(Boolean));
  }

  log() {
    return this.outboxRepository.list().reverse();
  }

  reset() {
    this.outboxRepository.clear();
  }
}
