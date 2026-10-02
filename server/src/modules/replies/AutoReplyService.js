export class AutoReplyService {
  constructor({ settingsService, templateService, activityLog }) {
    Object.assign(this, { settingsService, templateService, activityLog });
    this.replyService = null;
  }

  attach(replyService) {
    this.replyService = replyService;
  }

  async maybeReply(message) {
    const settings = this.settingsService.get();
    const template = this.templateService.find(message.classification.autoReplyTemplateId);
    if (!template || message.channel === 'system') return message;
    if (!settings.autoReply.enabled || !template.enabled) {
      this.activityLog.record('auto-reply-skipped', `Auto-reply “${template.name}” matched ${message.from.name}, but auto-replies are ${settings.autoReply.enabled ? 'off for this template' : 'switched off'}`, message.id);
      return message;
    }
    const text = this.templateService.render(template, message, settings);
    try {
      return await this.replyService.send(message.id, { text }, { auto: true, templateName: template.name });
    } catch (error) {
      this.activityLog.record('auto-reply-failed', `Auto-reply to ${message.from.name} failed: ${error.message}`, message.id);
      return message;
    }
  }
}
