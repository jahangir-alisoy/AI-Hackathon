import express from 'express';
import { handle } from '../../core/http.js';

export const calendarRouter = ({ eventService, calendarFeed }) => {
  const router = express.Router();
  router.get('/feed', handle((request) => calendarFeed.build(request.query)));
  router.get('/events', handle((request) => eventService.list(request.query)));
  router.post('/events', handle((request) => eventService.create(request.body)));
  router.put('/events/:id', handle((request) => eventService.update(request.params.id, request.body)));
  router.delete('/events/:id', handle((request) => eventService.remove(request.params.id)));
  return router;
};
