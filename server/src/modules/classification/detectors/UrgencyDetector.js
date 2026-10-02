const URGENT_WORDS = /\b(urgent|asap|immediately|right away|emergency)\b/i;

export class UrgencyDetector {
  detect(message) {
    const match = `${message.subject} ${message.body}`.match(URGENT_WORDS);
    return match ? { priority: 'urgent', category: null, reason: `Marked as urgent ("${match[0]}")` } : null;
  }
}
