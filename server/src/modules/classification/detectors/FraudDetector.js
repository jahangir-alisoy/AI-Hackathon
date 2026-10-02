const INTERNAL_LOOKING_NAME = /\b(it|security|helpdesk|admin|hr|payroll|support)\b/i;
const CREDENTIAL_LURE = /(verify|suspend|click here|password|log ?in|sign-in|wire transfer|gift card)/i;
const LINK = /(\[[^\]]*link\]|https?:\/\/)/i;

export class FraudDetector {
  detect(message) {
    const handle = message.from.handle ?? '';
    if (!handle.includes('@')) return null;
    const text = `${message.subject} ${message.body}`;
    const signals = [];
    if (INTERNAL_LOOKING_NAME.test(message.from.name)) signals.push(`"${message.from.name}" looks internal but writes from ${handle}`);
    if (CREDENTIAL_LURE.test(text)) signals.push('credential or payment lure');
    if (LINK.test(text)) signals.push('asks you to click a link');
    if (signals.length < 2) return null;
    return { priority: 'high', category: 'Fraud', reason: `Likely phishing: ${signals.join(', ')}`, tags: ['fraud'] };
  }
}
