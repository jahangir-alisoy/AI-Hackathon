import express from 'express';
import { handle } from '../../core/http.js';
import { CATEGORIES, PRIORITIES } from '../messages/vocabulary.js';
import { RULE_FIELDS, RULE_OPERATORS } from './RuleMatcher.js';

export const rulesRouter = ({ ruleService, messageService, classificationEngine }) => {
  const router = express.Router();
  const afterChange = async (result) => {
    await messageService.reclassifyAll();
    return result;
  };
  router.get('/', handle(() => ruleService.list()));
  router.get('/vocabulary', handle(() => ({ fields: RULE_FIELDS, operators: RULE_OPERATORS, priorities: PRIORITIES, categories: CATEGORIES })));
  router.post('/', handle((request) => afterChange(ruleService.create(request.body))));
  router.put('/:id', handle((request) => afterChange(ruleService.update(request.params.id, request.body))));
  router.delete('/:id', handle(async (request) => {
    ruleService.remove(request.params.id);
    await messageService.reclassifyAll();
  }));
  router.post('/test', handle((request) => {
    const input = request.body ?? {};
    const message = {
      channel: input.channel ?? 'email',
      from: { name: input.from || 'Unknown sender', handle: input.handle || null, title: '' },
      subject: input.subject ?? '',
      body: input.body ?? '',
      receivedAt: new Date().toISOString(),
      override: null,
    };
    return classificationEngine.classify(message);
  }));
  return router;
};
