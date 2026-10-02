import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { startTestServer, SIGNING_SECRET } from './helpers.js';

const slackCalls = [];
const slackFetch = async (url, options) => {
  slackCalls.push({ url, body: JSON.parse(options.body) });
  const method = url.split('/').pop();
  const responses = {
    'users.info': { ok: true, user: { real_name: 'Bekzod Nazarov' } },
    'chat.postMessage': { ok: true, ts: '1700000000.000100' },
    'conversations.open': { ok: true, channel: { id: 'D123' } },
  };
  return { json: async () => responses[method] };
};

let server;
before(async () => {
  server = await startTestServer({ slackFetch });
});
after(() => server.close());

const sign = (rawBody, timestamp = Math.floor(Date.now() / 1000)) => ({
  'x-slack-request-timestamp': String(timestamp),
  'x-slack-signature': `v0=${createHmac('sha256', SIGNING_SECRET).update(`v0:${timestamp}:${rawBody}`).digest('hex')}`,
});

test('seeds the scenario into one inbox', async () => {
  const { body } = await server.call('GET', '/overview');
  assert.equal(body.counts.email.total, 33);
  assert.equal(body.counts.slack.total, 15);
  assert.ok(body.counts.system.total > 0);
  assert.ok(body.today.length >= 14);
});

test('flags the fake IT security email as fraud', async () => {
  const { body } = await server.call('GET', '/messages?category=Fraud');
  assert.deepEqual(body.map((message) => message.subject), ['ACTION REQUIRED: Verify your login within 24 hours']);
});

test('a Davr Bank message is urgent because of the trained rule', async () => {
  const { body } = await server.call('POST', '/integrations/slack/simulate', { from: { name: 'Dilnoza Rashidova' }, body: 'Quick question about the Davr rebranding timeline.' });
  assert.equal(body.classification.priority, 'urgent');
  assert.ok(body.classification.reasons.some((reason) => reason.source === 'rule'));
});

test('a verified Slack event is stored, classified, and the reply goes back through Slack', async () => {
  const payload = JSON.stringify({
    type: 'event_callback',
    event: { type: 'message', user: 'U0BEKZOD', channel: 'D0DAVR', text: 'Can you confirm the DSA is signed?', ts: '1700000000.000001', client_msg_id: 'abc-1' },
  });
  const received = await server.call('POST', '/integrations/slack/events', payload, sign(payload));
  assert.equal(received.status, 200);
  const [message] = (await server.call('GET', '/messages?channel=slack&q=DSA is signed')).body;
  assert.equal(message.from.name, 'Bekzod Nazarov');
  assert.equal(message.source, 'slack-api');

  const drafted = await server.call('POST', `/messages/${message.id}/draft`, {});
  assert.ok(drafted.body.draft.text.length > 0);
  const regenerated = await server.call('POST', `/messages/${message.id}/draft`, {});
  assert.notEqual(regenerated.body.draft.text, drafted.body.draft.text);

  const sent = await server.call('POST', `/messages/${message.id}/send`, { text: 'Signing it now.' });
  assert.equal(sent.body.status, 'done');
  assert.equal(sent.body.replies[0].delivery, 'slack-api');
  const post = slackCalls.find((call) => call.url.endsWith('chat.postMessage'));
  assert.deepEqual(post.body, { channel: 'D0DAVR', text: 'Signing it now.' });
});

test('rejects Slack events with a bad signature and answers the URL challenge', async () => {
  const bad = await server.call('POST', '/integrations/slack/events', '{"type":"url_verification","challenge":"x"}', { 'x-slack-request-timestamp': '1', 'x-slack-signature': 'v0=bad' });
  assert.equal(bad.status, 401);
  const payload = '{"type":"url_verification","challenge":"abc"}';
  const ok = await server.call('POST', '/integrations/slack/events', payload, sign(payload));
  assert.deepEqual(ok.body, { challenge: 'abc' });
});

test('auto-replies only when switched on', async () => {
  const off = await server.call('POST', '/integrations/slack/simulate', { from: { name: 'Marcus Lee' }, body: 'Can we push our sync to 4:45?' });
  assert.equal(off.body.replies.length, 0);
  await server.call('PATCH', '/settings', { autoReply: { enabled: true } });
  const on = await server.call('POST', '/integrations/slack/simulate', { from: { name: 'Marcus Lee' }, body: 'Can we move it to 5:15 instead?' });
  assert.equal(on.body.replies[0].auto, true);
  await server.call('PATCH', '/settings', { autoReply: { enabled: false } });
});

test('a new rule re-classifies existing messages', async () => {
  const created = await server.call('POST', '/rules', {
    name: 'Compliance is noise today',
    conditions: [{ field: 'subject', operator: 'contains', value: 'compliance training' }],
    actions: { priority: 'low', category: 'Noise' },
  });
  assert.equal(created.status, 200);
  const [message] = (await server.call('GET', '/messages?q=compliance training')).body;
  assert.equal(message.classification.category, 'Noise');
  await server.call('DELETE', `/rules/${created.body.id}`);
  const [after] = (await server.call('GET', '/messages?q=compliance training')).body;
  assert.notEqual(after.classification.category, 'Noise');
});

test('the CEO override wins over functions and rules', async () => {
  const [message] = (await server.call('GET', '/messages?q=Early bird')).body;
  const updated = await server.call('PATCH', `/messages/${message.id}`, { override: { priority: 'urgent' } });
  assert.equal(updated.body.classification.priority, 'urgent');
});

test('blocked senders become noise', async () => {
  await server.call('PATCH', '/settings', { blockedSenders: ['CloudMetrics'] });
  const [message] = (await server.call('GET', '/messages?q=CloudMetrics')).body;
  assert.equal(message.classification.priority, 'low');
});

test('validates input', async () => {
  assert.equal((await server.call('POST', '/messages', { channel: 'fax', from: { name: 'x' }, body: 'y' })).status, 400);
  assert.equal((await server.call('POST', '/rules', { name: 'x', conditions: [], actions: {} })).status, 400);
  assert.equal((await server.call('PATCH', '/settings', { theme: 'pink' })).status, 400);
  assert.equal((await server.call('POST', '/calendar/events', { title: 'x', start: '2026-01-01T10:00:00Z', end: '2026-01-01T09:00:00Z' })).status, 400);
});

test('calendar CRUD and the merged feed', async () => {
  const created = await server.call('POST', '/calendar/events', { title: 'Call with Bekzod', start: '2030-01-01T10:00:00.000Z', end: '2030-01-01T10:30:00.000Z' });
  assert.equal(created.status, 200);
  const feed = await server.call('GET', '/calendar/feed?from=2030-01-01T00:00:00.000Z&to=2030-01-02T00:00:00.000Z&sources=events');
  assert.equal(feed.body.items.length, 1);
  await server.call('DELETE', `/calendar/events/${created.body.id}`);
  const empty = await server.call('GET', '/calendar/feed?from=2030-01-01T00:00:00.000Z&to=2030-01-02T00:00:00.000Z&sources=events');
  assert.equal(empty.body.items.length, 0);
});

test('system notifications cannot be replied to', async () => {
  const [notice] = (await server.call('GET', '/messages?channel=system')).body;
  assert.equal((await server.call('POST', `/messages/${notice.id}/draft`, {})).status, 400);
});

test('briefings still work', async () => {
  const { body } = await server.call('GET', '/briefings/deliverables/one-pager?asOf=16:10');
  assert.equal(body.type, 'one-pager');
});
