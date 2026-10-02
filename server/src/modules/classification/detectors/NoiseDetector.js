const AUTOMATED_SENDER = /(no-?reply|notifications?|events|billing|newsletter|marketing|promo)/i;
const PROMO = /(early bird|subscription|unsubscribe|new notifications|register now|% off)/i;

export class NoiseDetector {
  detect(message) {
    const handle = message.from.handle ?? '';
    if (!handle.includes('@')) return null;
    if (!AUTOMATED_SENDER.test(handle) && !PROMO.test(`${message.subject} ${message.body}`)) return null;
    return { priority: 'low', category: 'Noise', reason: `Automated or promotional sender (${handle})` };
  }
}
