import { NotFoundError } from '../../core/errors.js';
import { requireOneOf } from '../../core/validation.js';
import { CATEGORIES, PRIORITIES, PRIORITY_RANK, STATUSES } from './vocabulary.js';

export class MessageService {
  constructor({ store, bus, classificationEngine, ruleService, activityLog }) {
    this.messages = store.collection('messages');
    Object.assign(this, { store, bus, classificationEngine, ruleService, activityLog });
  }

  list({ channel, priority, category, status, q } = {}) {
    const query = q?.toLowerCase();
    return this.messages.all()
      .filter((message) => !channel || message.channel === channel)
      .filter((message) => !priority || message.classification.priority === priority)
      .filter((message) => !category || message.classification.category === category)
      .filter((message) => (status ? message.status === status : message.status !== 'archived'))
      .filter((message) => !query || `${message.from.name} ${message.subject} ${message.body}`.toLowerCase().includes(query))
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }

  mostUrgent(limit = 8) {
    return this.messages.all()
      .filter((message) => ['new', 'read'].includes(message.status))
      .filter((message) => message.classification.category !== 'Noise')
      .filter((message) => message.classification.category !== 'Fraud' || message.status === 'new')
      .sort((a, b) => PRIORITY_RANK[b.classification.priority] - PRIORITY_RANK[a.classification.priority] || b.receivedAt.localeCompare(a.receivedAt))
      .slice(0, limit);
  }

  get(id) {
    const message = this.messages.get(id);
    if (!message) throw new NotFoundError('Message not found');
    return message;
  }

  findByExternalId(channel, externalId) {
    return externalId ? this.messages.find((message) => message.channel === channel && message.externalId === externalId)[0] ?? null : null;
  }

  async add(message, { useAi }) {
    const classification = await this.classificationEngine.classify(message, { useAi });
    const saved = this.messages.insert({ ...message, classification });
    this.ruleService.recordHits(classification.matchedRuleIds);
    this.bus.publish('message.created', saved);
    return saved;
  }

  async update(id, patch) {
    const message = this.get(id);
    const changes = {};
    if (patch.status !== undefined) changes.status = requireOneOf(patch.status, STATUSES, 'status');
    if (patch.override !== undefined) changes.override = this.validateOverride(patch.override);
    const next = { ...message, ...changes };
    if (patch.override !== undefined) {
      next.classification = this.classificationEngine.finalize(message.classification.base, next);
      this.activityLog.record('override', `You changed “${message.subject || message.body.slice(0, 50)}” to ${next.classification.priority} / ${next.classification.category}`, id);
    }
    const saved = this.messages.update(id, next);
    this.bus.publish('message.updated', saved);
    return saved;
  }

  save(id, patch) {
    const saved = this.messages.update(id, patch);
    this.bus.publish('message.updated', saved);
    return saved;
  }

  remove(id) {
    this.get(id);
    this.messages.remove(id);
    this.bus.publish('message.deleted', { id });
  }

  async reclassify(id, { useAi = false } = {}) {
    const message = this.get(id);
    const classification = await this.classificationEngine.classify(message, { useAi });
    return this.save(id, { classification });
  }

  async reclassifyAll() {
    const all = this.messages.all();
    await this.store.batchAsync(async () => {
      for (const message of all) {
        const base = message.classification.base.engine === 'claude'
          ? message.classification.base
          : await this.classificationEngine.analyze(message);
        this.messages.update(message.id, { classification: this.classificationEngine.finalize(base, message) });
      }
    });
    this.bus.publish('messages.reclassified', { count: all.length });
    return { count: all.length };
  }

  counts() {
    const active = this.messages.all().filter((message) => message.status !== 'archived');
    const byChannel = (channel) => active.filter((message) => message.channel === channel);
    return Object.fromEntries(['slack', 'email', 'system'].map((channel) => [channel, {
      total: byChannel(channel).length,
      unread: byChannel(channel).filter((message) => message.status === 'new').length,
      urgent: byChannel(channel).filter((message) => message.classification.priority === 'urgent' && message.status !== 'done').length,
    }]));
  }

  validateOverride(override) {
    if (override === null) return null;
    return {
      priority: override.priority ? requireOneOf(override.priority, PRIORITIES, 'priority') : null,
      category: override.category ? requireOneOf(override.category, CATEGORIES, 'category') : null,
    };
  }
}
