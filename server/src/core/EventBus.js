import { EventEmitter } from 'node:events';

export class EventBus {
  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  publish(type, payload) {
    this.emitter.emit('event', { type, payload, at: new Date().toISOString() });
  }

  subscribe(listener) {
    this.emitter.on('event', listener);
    return () => this.emitter.off('event', listener);
  }
}
