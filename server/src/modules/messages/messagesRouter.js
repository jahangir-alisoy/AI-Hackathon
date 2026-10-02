import express from 'express';
import { handle } from '../../core/http.js';

export const messagesRouter = ({ messageService, replyService, ingestionService }) => {
  const router = express.Router();
  router.get('/', handle((request) => messageService.list(request.query)));
  router.post('/', handle((request) => ingestionService.ingest(request.body, { source: 'simulator' })));
  router.get('/:id', handle((request) => messageService.get(request.params.id)));
  router.patch('/:id', handle((request) => messageService.update(request.params.id, request.body)));
  router.delete('/:id', handle((request) => messageService.remove(request.params.id)));
  router.post('/:id/reclassify', handle((request) => messageService.reclassify(request.params.id, { useAi: request.body?.useAi === true })));
  router.post('/:id/draft', handle((request) => replyService.generate(request.params.id, request.body ?? {})));
  router.put('/:id/draft', handle((request) => replyService.saveDraft(request.params.id, request.body ?? {})));
  router.delete('/:id/draft', handle((request) => replyService.discardDraft(request.params.id)));
  router.post('/:id/send', handle((request) => replyService.send(request.params.id, request.body ?? {})));
  return router;
};
