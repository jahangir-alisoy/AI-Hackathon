import { NotFoundError, ValidationError } from '../../core/errors.js';
import { requireOneOf, requireText } from '../../core/validation.js';
import { CATEGORIES, PRIORITIES } from '../messages/vocabulary.js';
import { RULE_FIELDS, RULE_OPERATORS } from './RuleMatcher.js';

export class RuleService {
  constructor({ store, bus }) {
    this.rules = store.collection('rules');
    this.bus = bus;
  }

  list() {
    return this.rules.all();
  }

  enabled() {
    return this.rules.all().filter((rule) => rule.enabled);
  }

  get(id) {
    const rule = this.rules.get(id);
    if (!rule) throw new NotFoundError('Rule not found');
    return rule;
  }

  create(input) {
    const rule = this.rules.insert({ ...this.validate(input), hits: 0, createdAt: new Date().toISOString() });
    this.bus.publish('rules.changed', rule);
    return rule;
  }

  update(id, input) {
    const existing = this.get(id);
    const rule = this.rules.update(id, this.validate({ ...existing, ...input }));
    this.bus.publish('rules.changed', rule);
    return rule;
  }

  remove(id) {
    this.get(id);
    this.rules.remove(id);
    this.bus.publish('rules.changed', { id });
  }

  recordHits(ruleIds) {
    for (const id of ruleIds) {
      const rule = this.rules.get(id);
      if (rule) this.rules.update(id, { hits: (rule.hits ?? 0) + 1 });
    }
  }

  validate(input) {
    const conditions = Array.isArray(input.conditions) ? input.conditions : [];
    if (!conditions.length) throw new ValidationError('A rule needs at least one condition');
    const actions = input.actions ?? {};
    const validated = {
      name: requireText(input.name, 'name', 120),
      enabled: input.enabled !== false,
      match: requireOneOf(input.match ?? 'all', ['all', 'any'], 'match'),
      conditions: conditions.map((condition) => ({
        field: requireOneOf(condition.field, RULE_FIELDS, 'condition field'),
        operator: requireOneOf(condition.operator, RULE_OPERATORS, 'condition operator'),
        value: requireText(condition.value, 'condition value', 500),
      })),
      actions: {
        priority: actions.priority ? requireOneOf(actions.priority, PRIORITIES, 'priority') : null,
        category: actions.category ? requireOneOf(actions.category, CATEGORIES, 'category') : null,
        tag: actions.tag ? requireText(actions.tag, 'tag', 40) : null,
        autoReplyTemplateId: actions.autoReplyTemplateId || null,
      },
      createdFrom: input.createdFrom ?? null,
    };
    if (!Object.values(validated.actions).some(Boolean)) throw new ValidationError('A rule needs at least one action');
    return validated;
  }
}
