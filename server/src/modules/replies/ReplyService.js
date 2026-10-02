import { ValidationError } from '../../core/errors.js';
import { optionalText, requireText } from '../../core/validation.js';

export class ReplyService {
  constructor({ messageService, settingsService, gateway, claudeGenerator, templateGenerator, activityLog }) {
    Object.assign(this, { messageService, settingsService, gateway, claudeGenerator, templateGenerator, activityLog });
  }

  async generate(id, { instruction } = {}) {
    const message = this.messageService.get(id);
    this.assertReplyable(message);
    const settings = this.settingsService.get();
    const version = (message.draft?.version ?? 0) + 1;
    const context = { settings, version, instruction: optionalText(instruction, 'instruction', 500), previous: message.draft?.text };
    let generator = this.claudeGenerator.isAvailable(settings) ? this.claudeGenerator : this.templateGenerator;
    let note = null;
    let text;
    try {
      text = await generator.generate(message, context);
    } catch (error) {
      generator = this.templateGenerator;
      note = `Claude unavailable (${error.message}); used a template`;
      text = await generator.generate(message, context);
    }
    return this.messageService.save(id, {
      draft: { text, version, generator: generator.name, instruction: context.instruction, note, updatedAt: new Date().toISOString() },
    });
  }

  saveDraft(id, { text }) {
    const message = this.messageService.get(id);
    return this.messageService.save(id, { draft: { ...(message.draft ?? { version: 0, generator: 'ceo' }), text: requireText(text, 'text', 8000), updatedAt: new Date().toISOString() } });
  }

  discardDraft(id) {
    this.messageService.get(id);
    return this.messageService.save(id, { draft: null });
  }

  async send(id, { text }, { auto = false, templateName = null } = {}) {
    const message = this.messageService.get(id);
    this.assertReplyable(message);
    const body = requireText(text, 'text', 8000);
    const delivery = await this.gateway.send(message, body);
    const reply = { id: `${Date.now()}`, text: body, sentAt: new Date().toISOString(), auto, templateName, ...delivery };
    const saved = this.messageService.save(id, { replies: [...message.replies, reply], draft: null, status: 'done' });
    this.activityLog.record(auto ? 'auto-reply' : 'sent', `${auto ? `Auto-replied (${templateName})` : 'You replied'} to ${message.from.name} via ${message.channel} · ${delivery.delivery === 'slack-api' ? 'delivered to Slack' : 'simulated delivery'}`, id);
    return saved;
  }

  assertReplyable(message) {
    if (!this.gateway.canReply(message.channel)) throw new ValidationError('System notifications cannot be replied to');
  }
}
