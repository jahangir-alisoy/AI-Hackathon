import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_AGE_SECONDS = 60 * 5;

export class SlackSignatureVerifier {
  constructor(signingSecret = process.env.SLACK_SIGNING_SECRET) {
    this.signingSecret = signingSecret;
  }

  isConfigured() {
    return Boolean(this.signingSecret);
  }

  verify({ timestamp, signature, rawBody, now = Date.now() }) {
    if (!this.isConfigured()) return false;
    if (!timestamp || !signature || Math.abs(now / 1000 - Number(timestamp)) > MAX_AGE_SECONDS) return false;
    const expected = `v0=${createHmac('sha256', this.signingSecret).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
