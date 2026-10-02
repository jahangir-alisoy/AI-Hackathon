const SLACK_API = 'https://slack.com/api';

export class SlackClient {
  constructor({ token = process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN, fetchImpl = globalThis.fetch } = {}) {
    this.token = token;
    this.fetch = fetchImpl;
    this.userNames = new Map();
    this.channelNames = new Map();
    this.selfId = null;
  }

  isConfigured() {
    return Boolean(this.token);
  }

  mode() {
    if (!this.token) return 'none';
    return this.token.startsWith('xoxp-') ? 'user' : 'bot';
  }

  async call(method, params = {}) {
    const body = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)]));
    const response = await this.fetch(`${SLACK_API}/${method}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(`Slack ${method} failed: ${result.error}`);
    return result;
  }

  async ownUserId() {
    if (!this.isConfigured()) return null;
    if (!this.selfId) {
      try {
        this.selfId = (await this.call('auth.test')).user_id;
      } catch {
        return null;
      }
    }
    return this.selfId;
  }

  async userName(userId) {
    if (!this.isConfigured() || !userId) return userId ?? 'Slack user';
    if (!this.userNames.has(userId)) {
      try {
        const { user } = await this.call('users.info', { user: userId });
        this.userNames.set(userId, user.real_name || user.name);
      } catch {
        this.userNames.set(userId, userId);
      }
    }
    return this.userNames.get(userId);
  }

  async channelName(channelId) {
    if (!this.isConfigured() || !channelId) return channelId;
    if (!this.channelNames.has(channelId)) {
      try {
        const { channel } = await this.call('conversations.info', { channel: channelId });
        this.channelNames.set(channelId, channel.name ? `#${channel.name}` : channelId);
      } catch {
        this.channelNames.set(channelId, channelId);
      }
    }
    return this.channelNames.get(channelId);
  }

  async postMessage({ channel, text, threadTs }) {
    return this.call('chat.postMessage', { channel, text, thread_ts: threadTs });
  }

  async openDirectMessage(userId) {
    const { channel } = await this.call('conversations.open', { users: userId });
    return channel.id;
  }
}
