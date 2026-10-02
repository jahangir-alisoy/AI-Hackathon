import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContainer } from '../src/app/createContainer.js';
import { createApp } from '../src/app/createApp.js';
import { SlackSignatureVerifier } from '../src/modules/channels/SlackSignatureVerifier.js';
import { SlackClient } from '../src/modules/channels/SlackClient.js';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SIGNING_SECRET = 'test-signing-secret';

export const startTestServer = async ({ slackFetch } = {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'standin-'));
  const container = createContainer({
    dataDir: root,
    storeFile: path.join(dir, 'store.json'),
    outboxFile: path.join(dir, 'outbox.json'),
    llmClient: { model: 'none', isEnabled: () => false },
    slackClient: new SlackClient({ token: slackFetch ? 'xoxb-test' : undefined, fetchImpl: slackFetch }),
    slackVerifier: new SlackSignatureVerifier(SIGNING_SECRET),
  });
  await container.seeder.seed();
  const server = createApp(container).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (method, url, body, headers = {}) => {
    const response = await fetch(`${baseUrl}${url}`, {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  };
  return { container, call, close: () => server.close() };
};
