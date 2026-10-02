export class OverviewService {
  constructor({ messageService, eventService, activityLog, settingsService, gateway, llmClient }) {
    Object.assign(this, { messageService, eventService, activityLog, settingsService, gateway, llmClient });
  }

  build() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59).toISOString();
    const all = this.messageService.list({});
    return {
      settings: { ...this.settingsService.get(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      counts: this.messageService.counts(),
      urgent: this.messageService.mostUrgent(8),
      drafts: all.filter((message) => message.draft).slice(0, 6),
      fraud: all.filter((message) => message.classification.category === 'Fraud' && message.status !== 'done'),
      today: this.eventService.list({ from: startOfDay, to: endOfDay }),
      activity: this.activityLog.recent(12),
      integrations: { ...this.gateway.status(), claude: { connected: this.llmClient.isEnabled() } },
      totals: {
        messages: all.length,
        handled: all.filter((message) => ['low', 'normal'].includes(message.classification.priority)).length,
        needsYou: all.filter((message) => ['urgent', 'high'].includes(message.classification.priority) && message.status !== 'done').length,
      },
    };
  }
}
