import { ValidationError } from '../../core/errors.js';
import { optionalText, requireIsoDate, requireOneOf, requireText } from '../../core/validation.js';
import { CHANNELS } from '../messages/vocabulary.js';

export class IngestionService {
  constructor({ messageService, autoReplyService, settingsService, activityLog }) {
    Object.assign(this, { messageService, autoReplyService, settingsService, activityLog });
  }

  async ingest(input, { source, useAi } = {}) {
    const message = this.normalize(input, source);
    const duplicate = this.messageService.findByExternalId(message.channel, message.externalId);
    if (duplicate) return duplicate;
    const settings = this.settingsService.get();
    const saved = await this.messageService.add(message, { useAi: useAi ?? settings.ai.classifyNewMessages });
    if (source !== 'seed') {
      this.activityLog.record('received', `${this.label(saved)} from ${saved.from.name} → ${saved.classification.priority} · ${saved.classification.category}`, saved.id);
      return this.autoReplyService.maybeReply(saved);
    }
    return saved;
  }

  normalize(input, source) {
    const channel = requireOneOf(input.channel, CHANNELS, 'channel');
    const from = input.from ?? {};
    return {
      channel,
      source: source ?? 'api',
      externalId: input.externalId ? String(input.externalId) : null,
      conversationId: input.conversationId ?? null,
      conversationName: optionalText(input.conversationName, 'conversationName', 120),
      threadTs: input.threadTs ?? null,
      from: {
        name: requireText(from.name, 'from.name', 120),
        handle: optionalText(from.handle, 'from.handle', 200) || null,
        title: optionalText(from.title, 'from.title', 120),
      },
      subject: optionalText(input.subject, 'subject', 300),
      body: this.body(input),
      receivedAt: input.receivedAt ? requireIsoDate(input.receivedAt, 'receivedAt') : new Date().toISOString(),
      status: 'new',
      override: null,
      draft: null,
      replies: [],
    };
  }

  body(input) {
    if (!input.body && !input.subject) throw new ValidationError('A message needs a subject or a body');
    return optionalText(input.body, 'body', 20_000);
  }

  label(message) {
    return { slack: 'Slack message', email: 'Email', system: 'Notification' }[message.channel];
  }
}
