const FIELD_VALUES = {
  any: (message) => [message.from.name, message.from.handle, message.subject, message.body].join(' '),
  sender: (message) => `${message.from.name} ${message.from.handle ?? ''}`,
  subject: (message) => message.subject ?? '',
  body: (message) => message.body ?? '',
  channel: (message) => message.channel,
  category: (message, classification) => classification?.category ?? '',
  priority: (message, classification) => classification?.priority ?? '',
};

const OPERATORS = {
  contains: (text, value) => text.toLowerCase().includes(value.toLowerCase()),
  equals: (text, value) => text.trim().toLowerCase() === value.trim().toLowerCase(),
  startsWith: (text, value) => text.trim().toLowerCase().startsWith(value.trim().toLowerCase()),
  regex: (text, value) => {
    try {
      return new RegExp(value, 'i').test(text);
    } catch {
      return false;
    }
  },
};

export const RULE_FIELDS = Object.keys(FIELD_VALUES);
export const RULE_OPERATORS = Object.keys(OPERATORS);

export class RuleMatcher {
  matches(rule, message, classification = null) {
    const results = rule.conditions.map((condition) =>
      OPERATORS[condition.operator](FIELD_VALUES[condition.field](message, classification), condition.value));
    return rule.match === 'any' ? results.some(Boolean) : results.every(Boolean);
  }
}
