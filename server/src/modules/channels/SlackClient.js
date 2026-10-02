const SLACK_API = 'https://slack.com/api';

export class SlackClient {
  constructor({ token = process.env.SLACK_BOT_TOKEN, fetchImpl = globalThis.fetch } = {}) {
    this.token = token;
    this.fetch = fetchImpl;
    this.userNames = new Map();
  }

  isConfigured() {
    return Boolean(this.token);
  }

  async call(method, body) {
    const response = await this.fetch(`${SLACK_API}/${method}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(`Slack ${method} failed: ${result.error}`);
    return result;
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

  async postMessage({ channel, text, threadTs }) {
    return this.call('chat.postMessage', { channel, text, ...(threadTs ? { thread_ts: threadTs } : {}) });
  }

  async openDirectMessage(userId) {
    const { channel } = await this.call('conversations.open', { users: userId });
    return channel.id;
  }
}
