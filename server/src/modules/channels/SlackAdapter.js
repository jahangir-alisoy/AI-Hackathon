export class SlackAdapter {
  channel = 'slack';

  constructor(slackClient) {
    this.slackClient = slackClient;
  }

  status() {
    const details = {
      user: 'Connected with your user token: StandIn sees your direct messages and replies as you',
      bot: 'Connected with a bot token: StandIn sees messages sent to the bot and replies as the bot',
      none: 'Set SLACK_USER_TOKEN and SLACK_SIGNING_SECRET to connect your Slack',
    };
    const mode = this.slackClient.mode();
    return { connected: mode !== 'none', mode: mode === 'none' ? 'simulated' : 'live', tokenType: mode, detail: details[mode] };
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
