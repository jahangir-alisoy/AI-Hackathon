import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/createApp.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outboxFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'standin-')), 'outbox.json');
const disabledLlm = { model: 'none', isEnabled: () => false, complete: async () => '' };
let server;
let baseUrl;

before(async () => {
  server = createApp({ dataDir: root, outboxFile, llmClient: disabledLlm }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

const get = async (url) => (await fetch(`${baseUrl}${url}`)).json();

test('serves today in template mode', async () => {
  const today = await get('/today?asOf=16:10');
  assert.equal(today.mode, 'template');
  assert.equal(today.counts.needsYou, 4);
});

test('rejects a malformed clock', async () => {
  const response = await fetch(`${baseUrl}/today?asOf=25:99`);
  assert.equal(response.status, 400);
});

test('serves every deliverable with markdown', async () => {
  for (const type of ['one-pager', 'davr-kit', 'press', 'briefing']) {
    const deliverable = await get(`/deliverables/${type}?asOf=13:30`);
    assert.equal(deliverable.type, type);
    assert.ok(deliverable.markdown.length > 100);
  }
});

test('records approvals in the outbox and closes the topic', async () => {
  const response = await fetch(`${baseUrl}/approve/one-pager`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ decision: 'approved', content: '# Q3', asOf: '16:10' }),
  });
  assert.equal(response.status, 200);
  const outbox = await get('/outbox');
  assert.equal(outbox[0].type, 'one-pager');
  const today = await get('/today?asOf=16:10');
  assert.ok(!today.needsYou.some((card) => card.topic === 'onepager'));
});
