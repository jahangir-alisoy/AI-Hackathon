import { CATEGORIES, PRIORITY_RANK, higherPriority, raisePriority } from '../messages/vocabulary.js';

const CATEGORY_PRECEDENCE = ['Fraud', 'Noise', 'Decision', 'Approval', 'Scheduling', 'Later', 'FYI'];

export class ClassificationEngine {
  constructor({ detectors, ruleMatcher, ruleService, templateService, settingsService, aiClassifier }) {
    Object.assign(this, { detectors, ruleMatcher, ruleService, templateService, settingsService, aiClassifier });
  }

  async classify(message, { useAi = false } = {}) {
    return this.finalize(await this.analyze(message, { useAi }), message);
  }

  async analyze(message, { useAi = false } = {}) {
    const settings = this.settingsService.get();
    return useAi && this.aiClassifier.isAvailable(settings)
      ? this.fromAi(message, settings)
      : this.fromDetectors(message, settings);
  }

  finalize(base, message) {
    const withVip = this.applyVip(base, message, this.settingsService.get());
    const withRules = this.applyRules(withVip, message);
    return { ...this.applyOverride(withRules, message.override), base };
  }

  fromDetectors(message, settings) {
    const signals = this.detectors.map((detector) => detector.detect(message, { settings })).filter(Boolean);
    const category = CATEGORY_PRECEDENCE.find((candidate) => signals.some((signal) => signal.category === candidate)) ?? 'FYI';
    const forcedLow = category === 'Noise' && !signals.some((signal) => signal.category === 'Fraud');
    const highest = forcedLow ? 'low' : signals.filter((signal) => signal.priority).reduce((best, signal) => higherPriority(best, signal.priority), 'normal');
    const priority = category === 'Fraud' ? 'high' : highest;
    return {
      priority,
      category,
      engine: 'functions',
      tags: [...new Set(signals.flatMap((signal) => signal.tags ?? []))],
      deadline: signals.find((signal) => signal.deadline)?.deadline ?? null,
      reasons: signals.length ? signals.map((signal) => ({ source: 'detector', text: signal.reason })) : [{ source: 'detector', text: 'No action requested — information only' }],
      matchedRuleIds: [],
      autoReplyTemplateId: null,
    };
  }

  async fromAi(message, settings) {
    try {
      const result = await this.aiClassifier.classify(message, { settings, rules: this.ruleService.enabled() });
      return {
        priority: result.priority,
        category: CATEGORIES.includes(result.category) ? result.category : 'FYI',
        engine: 'claude',
        tags: result.category === 'Fraud' ? ['fraud'] : [],
        deadline: result.deadline || null,
        reasons: [{ source: 'ai', text: result.reason }],
        matchedRuleIds: [],
        autoReplyTemplateId: null,
      };
    } catch (error) {
      const fallback = this.fromDetectors(message, settings);
      return { ...fallback, reasons: [...fallback.reasons, { source: 'detector', text: `Claude unavailable, used functions (${error.message})` }] };
    }
  }

  applyVip(classification, message, settings) {
    const vip = settings.vipSenders.find((name) => message.from.name.toLowerCase().includes(name.toLowerCase()));
    if (!vip || classification.category === 'Noise' || classification.category === 'Fraud') return classification;
    return {
      ...classification,
      priority: raisePriority(classification.priority, 'high'),
      reasons: [...classification.reasons, { source: 'vip', text: `${vip} is on your VIP list` }],
    };
  }

  applyRules(classification, message) {
    return this.ruleService.enabled().reduce((current, rule) => {
      if (!this.ruleMatcher.matches(rule, message, current)) return current;
      const { priority, category, tag, autoReplyTemplateId } = rule.actions;
      const changes = [priority && `priority → ${priority}`, category && `category → ${category}`, tag && `tag “${tag}”`, autoReplyTemplateId && 'auto-reply'].filter(Boolean);
      return {
        ...current,
        priority: priority ?? current.priority,
        category: category ?? current.category,
        tags: tag ? [...new Set([...current.tags, tag])] : current.tags,
        autoReplyTemplateId: autoReplyTemplateId ?? current.autoReplyTemplateId,
        matchedRuleIds: [...current.matchedRuleIds, rule.id],
        reasons: [...current.reasons, { source: 'rule', text: `Rule “${rule.name}”: ${changes.join(', ')}`, ruleId: rule.id }],
      };
    }, classification);
  }

  applyOverride(classification, override) {
    if (!override) return { ...classification, score: PRIORITY_RANK[classification.priority] };
    return {
      ...classification,
      priority: override.priority ?? classification.priority,
      category: override.category ?? classification.category,
      reasons: [...classification.reasons, { source: 'ceo', text: `You set this to ${[override.priority, override.category].filter(Boolean).join(' / ')}` }],
      score: PRIORITY_RANK[override.priority ?? classification.priority],
    };
  }
}
