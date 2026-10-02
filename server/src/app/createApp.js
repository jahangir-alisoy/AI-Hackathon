import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { handle } from '../core/http.js';
import { streamRoute } from '../modules/realtime/streamRoute.js';
import { messagesRouter } from '../modules/messages/messagesRouter.js';
import { rulesRouter } from '../modules/rules/rulesRouter.js';
import { templatesRouter } from '../modules/templates/templatesRouter.js';
import { calendarRouter } from '../modules/calendar/calendarRouter.js';
import { settingsRouter } from '../modules/settings/settingsRouter.js';
import { integrationsRouter } from '../modules/channels/integrationsRouter.js';
import { overviewRouter } from '../modules/overview/overviewRouter.js';
import { briefingsRouter } from '../modules/briefings/briefingsRouter.js';

export const createApp = (container, { clientDir } = {}) => {
  const app = express();
  app.use(express.json({ limit: '1mb', verify: (request, response, buffer) => { request.rawBody = buffer; } }));

  app.get('/api/health', (request, response) => response.json({ ok: true }));
  app.get('/api/stream', streamRoute(container.bus));
  app.use('/api/overview', overviewRouter(container));
  app.use('/api/messages', messagesRouter(container));
  app.use('/api/rules', rulesRouter(container));
  app.use('/api/templates', templatesRouter(container));
  app.use('/api/calendar', calendarRouter(container));
  app.use('/api/settings', settingsRouter(container));
  app.use('/api/integrations', integrationsRouter(container));
  app.use('/api/briefings', briefingsRouter({ ...container, defaultAsOf: () => container.settingsService.get().scenarioTime }));
  app.post('/api/admin/reset', handle(async () => {
    container.store.reset();
    container.approvalService.reset();
    await container.seeder.seed();
    container.bus.publish('data.reset', {});
    return { ok: true };
  }));
  app.use('/api', (request, response) => response.status(404).json({ error: 'Not found' }));

  if (clientDir && fs.existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.get(/^\/(?!api).*/, (request, response) => response.sendFile(path.join(clientDir, 'index.html')));
  }
  return app;
};
