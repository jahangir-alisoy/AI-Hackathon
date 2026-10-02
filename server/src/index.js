import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './createApp.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const port = Number(process.env.PORT ?? 3001);

const app = createApp({
  dataDir: process.env.SCENARIO_DIR ?? root,
  outboxFile: process.env.OUTBOX_FILE ?? path.join(root, 'server', 'outbox', 'outbox.json'),
  clientDir: path.join(root, 'client', 'dist'),
});

app.listen(port, () => console.log(`StandIn API on http://localhost:${port}`));
