import { ValidationError } from '../../core/errors.js';

const DEFAULTS = {
  ceoName: 'Alex Morgan',
  assistantName: 'StandIn',
  company: 'ABB Super Bank',
  theme: 'system',
  ai: { useClaude: true, classifyNewMessages: true },
  autoReply: { enabled: false },
  vipSenders: ['Richard Voss', 'Sarah Kim', 'Daniel Ortiz'],
  blockedSenders: [],
  scenarioTime: '16:10',
};

const THEMES = ['system', 'light', 'dark'];
const STRING_LIST = (value, field) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new ValidationError(`${field} must be a list of names`);
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
};

export class SettingsService {
  constructor({ store, bus }) {
    this.store = store;
    this.bus = bus;
  }

  get() {
    const saved = this.store.getValue('settings') ?? {};
    return {
      ...DEFAULTS,
      ...saved,
      ai: { ...DEFAULTS.ai, ...saved.ai },
      autoReply: { ...DEFAULTS.autoReply, ...saved.autoReply },
    };
  }

  update(patch) {
    const current = this.get();
    const next = { ...current };
    if (patch.ceoName !== undefined) next.ceoName = this.name(patch.ceoName, 'ceoName');
    if (patch.assistantName !== undefined) next.assistantName = this.name(patch.assistantName, 'assistantName');
    if (patch.company !== undefined) next.company = this.name(patch.company, 'company');
    if (patch.theme !== undefined) {
      if (!THEMES.includes(patch.theme)) throw new ValidationError(`theme must be one of: ${THEMES.join(', ')}`);
      next.theme = patch.theme;
    }
    if (patch.ai !== undefined) next.ai = { ...current.ai, ...this.flags(patch.ai, ['useClaude', 'classifyNewMessages']) };
    if (patch.autoReply !== undefined) next.autoReply = { ...current.autoReply, ...this.flags(patch.autoReply, ['enabled']) };
    if (patch.vipSenders !== undefined) next.vipSenders = STRING_LIST(patch.vipSenders, 'vipSenders');
    if (patch.blockedSenders !== undefined) next.blockedSenders = STRING_LIST(patch.blockedSenders, 'blockedSenders');
    if (patch.scenarioTime !== undefined) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(patch.scenarioTime)) throw new ValidationError('scenarioTime must be HH:MM');
      next.scenarioTime = patch.scenarioTime;
    }
    this.store.setValue('settings', next);
    this.bus.publish('settings.updated', next);
    return next;
  }

  name(value, field) {
    if (typeof value !== 'string' || !value.trim() || value.length > 80) throw new ValidationError(`${field} must be 1–80 characters`);
    return value.trim();
  }

  flags(value, allowed) {
    if (typeof value !== 'object' || value === null) throw new ValidationError('Expected an object of switches');
    return Object.fromEntries(Object.entries(value).filter(([key]) => allowed.includes(key)).map(([key, flag]) => {
      if (typeof flag !== 'boolean') throw new ValidationError(`${key} must be true or false`);
      return [key, flag];
    }));
  }
}
