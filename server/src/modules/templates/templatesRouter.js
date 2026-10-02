import express from 'express';
import { handle } from '../../core/http.js';

export const templatesRouter = ({ templateService }) => {
  const router = express.Router();
  router.get('/', handle(() => templateService.list()));
  router.post('/', handle((request) => templateService.create(request.body)));
  router.put('/:id', handle((request) => templateService.update(request.params.id, request.body)));
  router.delete('/:id', handle((request) => templateService.remove(request.params.id)));
  return router;
};
