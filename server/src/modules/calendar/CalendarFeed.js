const SOURCES = ['events', 'slack', 'email', 'system'];

export class CalendarFeed {
  constructor({ eventService, messageService }) {
    this.eventService = eventService;
    this.messageService = messageService;
  }

  build({ from, to, sources }) {
    const wanted = new Set((sources ? sources.split(',') : SOURCES).filter((source) => SOURCES.includes(source)));
    const events = wanted.has('events')
      ? this.eventService.list({ from, to }).map((event) => ({ ...event, kind: 'event', origin: event.source, source: 'events' }))
      : [];
    const messages = this.messageService.list({})
      .filter((message) => wanted.has(message.channel))
      .filter((message) => (!from || message.receivedAt >= from) && (!to || message.receivedAt <= to))
      .map((message) => ({
        kind: 'message',
        source: message.channel,
        id: message.id,
        title: message.subject || message.body.slice(0, 80),
        from: message.from.name,
        start: message.receivedAt,
        priority: message.classification.priority,
        category: message.classification.category,
        status: message.status,
      }));
    return { sources: SOURCES, items: [...events, ...messages] };
  }
}
