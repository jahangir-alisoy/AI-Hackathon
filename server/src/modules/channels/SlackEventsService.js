export class SlackEventsService {
  constructor({ verifier, slackClient, ingestionService }) {
    Object.assign(this, { verifier, slackClient, ingestionService });
  }

  async handle({ headers, rawBody, body }) {
    if (!this.verifier.verify({ timestamp: headers['x-slack-request-timestamp'], signature: headers['x-slack-signature'], rawBody })) {
      return { status: 401, body: { error: 'Invalid Slack signature' } };
    }
    if (body.type === 'url_verification') return { status: 200, body: { challenge: body.challenge } };
    const event = body.event;
    if (body.type !== 'event_callback' || event?.type !== 'message' || event.bot_id || event.subtype) {
      return { status: 200, body: { ok: true, ignored: true } };
    }
    await this.ingestionService.ingest({
      channel: 'slack',
      externalId: event.client_msg_id ?? event.ts,
      conversationId: event.channel,
      conversationName: event.channel_type === 'im' ? 'Direct message' : event.channel,
      threadTs: event.thread_ts ?? null,
      from: { name: await this.slackClient.userName(event.user), handle: event.user },
      body: event.text ?? '',
      receivedAt: new Date(Number(event.ts) * 1000).toISOString(),
    }, { source: 'slack-api' });
    return { status: 200, body: { ok: true } };
  }
}
