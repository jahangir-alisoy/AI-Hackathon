const CONVERSATION_LABELS = { im: 'Direct message', mpim: 'Group message' };

export class SlackEventsService {
  constructor({ verifier, slackClient, ingestionService }) {
    Object.assign(this, { verifier, slackClient, ingestionService });
    this.pending = Promise.resolve();
  }

  async handle({ headers, rawBody, body }) {
    if (!this.verifier.verify({ timestamp: headers['x-slack-request-timestamp'], signature: headers['x-slack-signature'], rawBody })) {
      return { status: 401, body: { error: 'Invalid Slack signature' } };
    }
    if (body.type === 'url_verification') return { status: 200, body: { challenge: body.challenge } };
    const event = body.event;
    if (body.type !== 'event_callback' || event?.type !== 'message' || event.bot_id || event.subtype || !event.user) {
      return { status: 200, body: { ok: true, ignored: true } };
    }
    this.pending = this.ingest(event, body).catch((error) => console.error('Slack event failed:', error));
    return { status: 200, body: { ok: true } };
  }

  async ingest(event, body) {
    if (await this.isOwnMessage(event, body)) return;
    await this.ingestionService.ingest({
      channel: 'slack',
      externalId: event.client_msg_id ?? event.ts,
      conversationId: event.channel,
      conversationName: CONVERSATION_LABELS[event.channel_type] ?? await this.slackClient.channelName(event.channel),
      threadTs: event.thread_ts ?? null,
      from: { name: await this.slackClient.userName(event.user), handle: event.user },
      body: event.text ?? '',
      receivedAt: new Date(Number(event.ts) * 1000).toISOString(),
    }, { source: 'slack-api' });
  }

  async isOwnMessage(event, body) {
    const authorized = new Set([
      ...(body.authorizations ?? []).map((authorization) => authorization.user_id),
      ...(body.authed_users ?? []),
    ]);
    if (authorized.has(event.user)) return true;
    return event.user === await this.slackClient.ownUserId();
  }
}
