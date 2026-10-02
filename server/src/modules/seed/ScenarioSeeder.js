import { toMinutes } from '../../shared/time.js';

const today = (clock) => {
  const now = new Date();
  const [hours, minutes] = clock.split(':').map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).toISOString();
};

const TEMPLATES = [
  { key: 'busy', name: 'In meetings — will reply today', channel: 'any', body: 'Hi {{firstName}}, thanks — I’m in back-to-back meetings until 4:30pm. I’ve seen this and will get back to you today.\n\n— {{ceoName}}' },
  { key: 'confirm', name: 'Schedule change confirmed', channel: 'any', body: 'Thanks {{firstName}}, works for me — calendar updated.' },
  { key: 'decline', name: 'Not interested, thanks', channel: 'email', body: 'Hi, thanks for reaching out. We’ll pass for now.\n\nBest regards,\n{{ceoName}}' },
];

const RULES = [
  { name: 'Davr Bank is always urgent', match: 'any', conditions: [{ field: 'any', operator: 'contains', value: 'davr' }], actions: { priority: 'urgent', tag: 'Davr Bank' } },
  { name: 'Press and journalists are urgent decisions', match: 'any', conditions: [{ field: 'any', operator: 'contains', value: 'journalist' }, { field: 'any', operator: 'contains', value: 'techinsight' }, { field: 'any', operator: 'contains', value: 'reporter' }], actions: { priority: 'urgent', category: 'Decision', tag: 'Press' } },
  { name: 'LinkedIn notifications are noise', match: 'all', conditions: [{ field: 'sender', operator: 'contains', value: 'linkedin' }], actions: { priority: 'low', category: 'Noise' } },
  { name: 'Auto-confirm schedule changes', match: 'all', conditions: [{ field: 'category', operator: 'equals', value: 'Scheduling' }], actions: { autoReplyTemplateId: 'confirm' } },
  { name: 'Politely decline vendor billing', enabled: false, match: 'all', conditions: [{ field: 'sender', operator: 'contains', value: 'billing@' }], actions: { priority: 'low', category: 'Later', autoReplyTemplateId: 'decline' } },
];

export class ScenarioSeeder {
  constructor({ store, worldStateBuilder, ingestionService, eventService, ruleService, templateService }) {
    Object.assign(this, { store, worldStateBuilder, ingestionService, eventService, ruleService, templateService });
  }

  isSeeded() {
    return Boolean(this.store.getValue('seededAt'));
  }

  async seed() {
    const world = this.worldStateBuilder.build('23:59');
    await this.store.batchAsync(async () => {
      const templateIds = this.seedTemplates();
      this.seedRules(templateIds);
      this.seedEvents(world.calendar.meetings);
      for (const input of this.messages(world)) await this.ingestionService.ingest(input, { source: 'seed', useAi: false });
    });
    this.store.setValue('seededAt', new Date().toISOString());
  }

  seedTemplates() {
    return Object.fromEntries(TEMPLATES.map(({ key, ...template }) => [key, this.templateService.create(template).id]));
  }

  seedRules(templateIds) {
    for (const rule of RULES) {
      const autoReplyTemplateId = rule.actions.autoReplyTemplateId ? templateIds[rule.actions.autoReplyTemplateId] : null;
      this.ruleService.create({ ...rule, actions: { ...rule.actions, autoReplyTemplateId } });
    }
  }

  seedEvents(meetings) {
    for (const meeting of meetings) {
      this.eventService.create({
        title: meeting.title,
        start: today(meeting.start),
        end: today(meeting.end),
        attendees: meeting.attendees,
        location: meeting.location,
        notes: meeting.notes,
        status: meeting.movedFrom ? `Moved from ${meeting.movedFrom}` : meeting.status,
        movedFrom: meeting.movedFrom,
        source: 'seed',
      });
    }
  }

  messages(world) {
    const fromEvents = world.events.map((event) => event.source === 'inbox'
      ? {
          channel: 'email',
          externalId: event.ref,
          from: event.role.includes('@') ? { name: event.actor, handle: event.role } : { name: event.actor, title: event.role },
          subject: event.subject,
          body: event.body,
          receivedAt: today(event.time),
        }
      : {
          channel: 'slack',
          externalId: event.ref,
          conversationName: `#${event.channel}`,
          from: { name: event.actor, title: event.role },
          body: event.body,
          receivedAt: today(event.time),
        });
    const reading = world.articles.map((article) => ({
      channel: 'system',
      externalId: article.ref,
      conversationName: 'Read later',
      from: { name: 'Read later', title: article.meta },
      subject: article.title,
      body: article.text,
      receivedAt: today('08:05'),
    }));
    const eventTimes = new Map(world.events.map((event) => [event.ref, event.time]));
    const calendarNotices = world.calendar.changes.map((change, index) => ({
      channel: 'system',
      externalId: `calendar-change-${index}`,
      conversationName: 'Calendar',
      from: { name: 'Calendar' },
      subject: 'Calendar updated by StandIn',
      body: change.description,
      receivedAt: today(change.sources.map((ref) => eventTimes.get(ref)).filter(Boolean).sort((a, b) => toMinutes(b) - toMinutes(a))[0] ?? '08:00'),
    }));
    return [...fromEvents, ...reading, ...calendarNotices];
  }
}
