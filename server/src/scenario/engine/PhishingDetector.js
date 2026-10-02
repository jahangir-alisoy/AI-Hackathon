const INTERNAL_LOOKING_NAME = /\b(it|security|helpdesk|admin|hr|payroll)\b/i;
const CREDENTIAL_LURE = /(verify|suspend|click here|password|log ?in|sign-in)/i;
const LINK = /(\[[^\]]*link\]|https?:\/\/)/i;

export class PhishingDetector {
  assess(event) {
    if (!event.role.includes('@')) return null;
    const text = `${event.subject} ${event.body}`;
    const signals = [];
    if (INTERNAL_LOOKING_NAME.test(event.actor)) {
      signals.push(`Display name "${event.actor}" looks internal, but the sender is external (${event.role})`);
    }
    if (CREDENTIAL_LURE.test(text)) signals.push('Urgent account / credential verification lure');
    if (LINK.test(text)) signals.push('Asks you to click a link');
    return signals.length >= 2 ? { eventId: event.id, signals } : null;
  }
}
