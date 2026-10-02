import express from 'express';
import { handle } from '../../core/http.js';

export const integrationsRouter = ({ slackEventsService, ingestionService }) => {
  const router = express.Router();

  router.post('/slack/events', async (request, response) => {
    try {
      const result = await slackEventsService.handle({ headers: request.headers, rawBody: request.rawBody?.toString('utf8') ?? '', body: request.body ?? {} });
      response.status(result.status).json(result.body);
    } catch (error) {
      console.error(error);
      response.status(200).json({ ok: false });
    }
  });

  router.post('/slack/simulate', handle((request) => ingestionService.ingest({ ...request.body, channel: 'slack' }, { source: 'simulator' })));
  router.post('/email/inbound', handle((request) => ingestionService.ingest({ ...request.body, channel: 'email' }, { source: 'webhook' })));
  router.post('/system', handle((request) => ingestionService.ingest({ ...request.body, channel: 'system' }, { source: 'webhook' })));
  return router;
};
