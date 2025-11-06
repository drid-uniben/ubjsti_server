import { Router } from 'express';
import reconciliationController from '../controllers/reconciliation.controller';
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
  reconciliationController.handleDiscrepancy
);

export default router;
