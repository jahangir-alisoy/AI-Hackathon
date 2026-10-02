import { ValidationError } from '../../core/errors.js';

export class ChannelGateway {
  constructor(adapters) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.channel, adapter]));
  }

  send(message, text) {
    const adapter = this.adapters.get(message.channel);
    if (!adapter) throw new ValidationError(`No sender for channel ${message.channel}`);
    return adapter.send(message, text);
  }

  canReply(channel) {
    return channel !== 'system';
  }

  status() {
    return Object.fromEntries([...this.adapters.values()].map((adapter) => [adapter.channel, adapter.status()]));
  }
}
