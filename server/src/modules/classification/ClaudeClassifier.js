import { CATEGORIES, PRIORITIES } from '../messages/vocabulary.js';

const SCHEMA = {
  type: 'object',
  properties: {
    priority: { type: 'string', enum: PRIORITIES },
    category: { type: 'string', enum: CATEGORIES },
    reason: { type: 'string' },
    deadline: { type: 'string' },
  },
  required: ['priority', 'category', 'reason', 'deadline'],
  additionalProperties: false,
};

const describeRule = (rule) =>
  `- "${rule.name}": when ${rule.conditions.map((c) => `${c.field} ${c.operator} "${c.value}"`).join(rule.match === 'any' ? ' or ' : ' and ')} → ${Object.entries(rule.actions).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ')}`;

export class ClaudeClassifier {
  constructor(llmClient) {
    this.llmClient = llmClient;
  }

  isAvailable(settings) {
    return settings.ai.useClaude && this.llmClient.isEnabled();
  }

  classify(message, { settings, rules }) {
    const system = [
      `You triage incoming messages for ${settings.ceoName}, CEO of ${settings.company}.`,
      'Priorities: urgent = needs the CEO within a few hours; high = needs the CEO today; normal = useful, no action; low = noise or later.',
      'Categories: Decision, Approval, Scheduling, FYI, Later, Noise, Fraud (phishing, impersonation, payment scams).',
      'Return the deadline as HH:MM in 24h if the message names one, otherwise an empty string. Keep the reason to one sentence.',
      `VIP senders: ${settings.vipSenders.join(', ') || 'none'}.`,
      rules.length ? `The CEO trained these rules; they are applied after you, but use them to understand what matters:\n${rules.map(describeRule).join('\n')}` : '',
    ].filter(Boolean).join('\n');
    const prompt = `Channel: ${message.channel}\nFrom: ${message.from.name}${message.from.handle ? ` <${message.from.handle}>` : ''}${message.from.title ? ` (${message.from.title})` : ''}\nReceived: ${message.receivedAt}\nSubject: ${message.subject || '(none)'}\n\n${message.body}`;
    return this.llmClient.completeJson(system, prompt, SCHEMA);
  }
}
