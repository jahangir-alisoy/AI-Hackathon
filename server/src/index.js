import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContainer } from './app/createContainer.js';
import { createApp } from './app/createApp.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const port = Number(process.env.PORT ?? 3001);

const container = createContainer({
  dataDir: process.env.SCENARIO_DIR ?? root,
  storeFile: process.env.STORE_FILE ?? path.join(root, 'server', 'data', 'store.json'),
  outboxFile: process.env.OUTBOX_FILE ?? path.join(root, 'server', 'data', 'briefings-outbox.json'),
});

if (!container.seeder.isSeeded()) await container.seeder.seed();

createApp(container, { clientDir: path.join(root, 'client', 'dist') }).listen(port, () => {
  console.log(`StandIn on http://localhost:${port}`);
  console.log(`Claude: ${container.llmClient.isEnabled() ? 'connected' : 'not configured (functions mode)'} · Slack: ${container.gateway.status().slack.mode}`);
});
