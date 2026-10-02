import express from 'express';
import { isValidClock } from '../../shared/time.js';

const readAsOf = (request, defaultAsOf) => {
  const asOf = request.query.asOf ?? request.body?.asOf ?? defaultAsOf();
  if (!isValidClock(asOf)) throw new RangeError('asOf must be HH:MM');
  return asOf;
};

const handle = (action) => async (request, response) => {
  try {
    response.json(await action(request));
  } catch (error) {
    const status = error instanceof RangeError ? 400 : error.status ?? 500;
    response.status(status).json({ error: error.message });
  }
};

const notFound = (message) => Object.assign(new Error(message), { status: 404 });

export const briefingsRouter = ({ worldStateBuilder, todayPresenter, deliverableService, approvalService, defaultAsOf }) => {
  const router = express.Router();
  const world = (request) => worldStateBuilder.build(readAsOf(request, defaultAsOf), approvalService.approvedTopics());

  router.get('/health', handle(() => ({ ok: true, mode: deliverableService.mode(), deliverables: deliverableService.types() })));

  router.get('/today', handle((request) => todayPresenter.present(world(request), deliverableService.mode())));

  router.get('/deliverables/:type', handle((request) => {
    if (!deliverableService.has(request.params.type)) throw notFound(`Unknown deliverable: ${request.params.type}`);
    return deliverableService.get(request.params.type, world(request));
  }));

  router.post('/run', handle(() => {
    deliverableService.clearCache();
    return { ok: true, mode: deliverableService.mode() };
  }));

  router.post('/approve/:type', handle((request) => {
    if (!deliverableService.has(request.params.type)) throw notFound(`Unknown deliverable: ${request.params.type}`);
    return approvalService.decide(request.params.type, request.body ?? {});
  }));

  router.get('/outbox', handle(() => approvalService.log()));

  router.post('/reset', handle(() => {
    approvalService.reset();
    deliverableService.clearCache();
    return { ok: true };
  }));

  return router;
};
