import { Router } from 'express';
import assignReviewController from '../controllers/assignReview.controller';
import { authenticateAdminToken } from '../../middleware/auth.middleware';
import validateRequest from '../../middleware/validateRequest';
import { z } from 'zod';

const router = Router();

const manuscriptIdSchema = z.object({
  params: z.object({
    manuscriptId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid manuscript ID format'),
  }),
});

router.post(
  '/:manuscriptId',
  authenticateAdminToken,
  validateRequest(manuscriptIdSchema),
  assignReviewController.assignReviewer
);

router.get(
  '/:manuscriptId/eligible-reviewers',
  authenticateAdminToken,
  validateRequest(manuscriptIdSchema),
  assignReviewController.getEligibleReviewers
);

router.get(
  '/check-overdue',
  authenticateAdminToken,
  assignReviewController.checkOverdueReviews
);

export default router;
