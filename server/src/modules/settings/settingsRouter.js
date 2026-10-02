import express from 'express';
import { handle } from '../../core/http.js';

export const settingsRouter = ({ settingsService, messageService, gateway, llmClient }) => {
  const router = express.Router();
  router.get('/', handle(() => ({ ...settingsService.get(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, integrations: { ...gateway.status(), claude: { connected: llmClient.isEnabled(), model: llmClient.model } } })));
  router.patch('/', handle(async (request) => {
    const settings = settingsService.update(request.body ?? {});
    if (request.body?.vipSenders || request.body?.blockedSenders) await messageService.reclassifyAll();
    return settings;
  }));
  return router;
};
