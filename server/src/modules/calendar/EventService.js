import { NotFoundError, ValidationError } from '../../core/errors.js';
import { optionalText, requireIsoDate, requireText } from '../../core/validation.js';

export class EventService {
  constructor({ store, bus }) {
    this.events = store.collection('events');
    this.bus = bus;
  }

  list({ from, to } = {}) {
    return this.events.all()
      .filter((event) => (!from || event.end >= from) && (!to || event.start <= to))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  get(id) {
    const event = this.events.get(id);
    if (!event) throw new NotFoundError('Event not found');
    return event;
  }

  create(input) {
    const event = this.events.insert({ ...this.validate(input), source: input.source ?? 'ceo' });
    this.bus.publish('event.changed', event);
    return event;
  }

  update(id, input) {
    const event = this.events.update(id, this.validate({ ...this.get(id), ...input }));
    this.bus.publish('event.changed', event);
    return event;
  }

  remove(id) {
    this.get(id);
    this.events.remove(id);
    this.bus.publish('event.changed', { id });
  }

  validate(input) {
    const start = requireIsoDate(input.start, 'start');
    const end = requireIsoDate(input.end, 'end');
    if (end <= start) throw new ValidationError('end must be after start');
    return {
      title: requireText(input.title, 'title', 200),
      start,
      end,
      attendees: Array.isArray(input.attendees) ? input.attendees.map(String).filter(Boolean) : [],
      location: optionalText(input.location, 'location', 200),
      notes: optionalText(input.notes, 'notes', 2000),
      status: optionalText(input.status, 'status', 200) || 'Confirmed',
      movedFrom: input.movedFrom ?? null,
    };
  }
}
