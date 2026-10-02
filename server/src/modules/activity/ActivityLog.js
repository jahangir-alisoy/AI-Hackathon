export class ActivityLog {
  constructor({ store, bus }) {
    this.entries = store.collection('activity');
    this.bus = bus;
  }

  record(type, text, messageId = null) {
    const entry = this.entries.insert({ type, text, messageId, at: new Date().toISOString() });
    this.bus.publish('activity.created', entry);
    return entry;
  }

  recent(limit = 30) {
    return this.entries.all().sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  }
}
