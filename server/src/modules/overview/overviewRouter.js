import express from 'express';
import { handle } from '../../core/http.js';

export const overviewRouter = ({ overviewService, activityLog }) => {
  const router = express.Router();
  router.get('/', handle(() => overviewService.build()));
  router.get('/activity', handle(() => activityLog.recent(100)));
  return router;
};
