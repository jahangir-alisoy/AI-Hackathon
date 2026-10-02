import { includesAny } from '../../../shared/text.js';

export class PhraseDetector {
  constructor({ phrases, priority, category, label }) {
    Object.assign(this, { phrases, priority, category, label });
  }

  detect(message) {
    const found = includesAny(`${message.subject} ${message.body}`, this.phrases);
    return found ? { priority: this.priority, category: this.category, reason: `${this.label}: "${found}"` } : null;
  }
}
