import express from 'express';
import decisionsController from '../controllers/finalDecisions.controller';
import {
  authenticateAdminToken,
  rateLimiter,
} from '../../middleware/auth.middleware';
const router = express.Router();

const adminRateLimiter = rateLimiter(5000, 60 * 60 * 1000);

router.get(
  '/',
  authenticateAdminToken,
  adminRateLimiter,
  decisionsController.getManuscriptsForDecision
);

router.put(
  '/:manuscriptId/status',
  authenticateAdminToken,
  adminRateLimiter,
  decisionsController.updateManuscriptStatus
);

export default router;
