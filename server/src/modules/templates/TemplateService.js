import { NotFoundError } from '../../core/errors.js';
import { requireOneOf, requireText } from '../../core/validation.js';

const TEMPLATE_CHANNELS = ['any', 'slack', 'email'];

export class TemplateService {
  constructor({ store, bus }) {
    this.templates = store.collection('templates');
    this.bus = bus;
  }

  list() {
    return this.templates.all();
  }

  get(id) {
    const template = this.templates.get(id);
    if (!template) throw new NotFoundError('Template not found');
    return template;
  }

  find(id) {
    return id ? this.templates.get(id) : null;
  }

  create(input) {
    const template = this.templates.insert(this.validate(input));
    this.bus.publish('templates.changed', template);
    return template;
  }

  update(id, input) {
    const template = this.templates.update(id, this.validate({ ...this.get(id), ...input }));
    this.bus.publish('templates.changed', template);
    return template;
  }

  remove(id) {
    this.get(id);
    this.templates.remove(id);
    this.bus.publish('templates.changed', { id });
  }

  render(template, message, settings) {
    const firstName = message.from.name.split(' ')[0];
    const values = {
      sender: message.from.name,
      firstName,
      ceoName: settings.ceoName,
      subject: message.subject || 'your message',
      company: settings.company,
    };
    return template.body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => values[key] ?? match);
  }

  validate(input) {
    return {
      name: requireText(input.name, 'name', 120),
      channel: requireOneOf(input.channel ?? 'any', TEMPLATE_CHANNELS, 'channel'),
      body: requireText(input.body, 'body', 4000),
      enabled: input.enabled !== false,
    };
  }
}
