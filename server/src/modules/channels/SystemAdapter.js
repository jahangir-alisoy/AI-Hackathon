import { ValidationError } from '../../core/errors.js';

export class SystemAdapter {
  channel = 'system';

  status() {
    return { connected: true, mode: 'local', detail: 'Computer and app notifications posted to /api/integrations/system' };
  }

  async send() {
    throw new ValidationError('System notifications cannot be replied to');
  }
}
