export class SlackAdapter {
  channel = 'slack';

  constructor(slackClient) {
    this.slackClient = slackClient;
  }

  status() {
    return this.slackClient.isConfigured()
      ? { connected: true, mode: 'live', detail: 'Replies are posted to Slack with chat.postMessage' }
      : { connected: false, mode: 'simulated', detail: 'Set SLACK_BOT_TOKEN to post replies into Slack' };
  }

  async send(message, text) {
    const isRealSlackMessage = Boolean(message.conversationId) || /^[UW][A-Z0-9]{6,}$/.test(message.from.handle ?? '');
    if (!this.slackClient.isConfigured() || !isRealSlackMessage) {
      return { delivery: 'simulated', to: `@${message.from.name}`, detail: 'Saved in StandIn (Slack not connected for this message)' };
    }
    const channel = message.conversationId ?? await this.slackClient.openDirectMessage(message.from.handle);
    const result = await this.slackClient.postMessage({ channel, text, threadTs: message.threadTs });
    return { delivery: 'slack-api', to: `@${message.from.name}`, externalId: result.ts, detail: `Posted to Slack channel ${channel}` };
  }
}
