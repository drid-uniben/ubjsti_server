import { Request, Response } from 'express';
import Manuscript, {
  ManuscriptStatus,
} from '../Manuscript_Submission/models/manuscript.model';
import Article from '../Articles/model/article.model';
import { NotFoundError, UnauthorizedError } from '../utils/customErrors';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import emailService from '../services/email.service';
import { IUser } from '../model/user.model';

interface AdminAuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

interface OverrideStatusRequest {
  status: string;
  reason: string;
  silentUpdate: boolean;
}

class OverrideDecisionController {
  /**
   * Override manuscript status without any checks or notifications
   * This is a privileged admin-only operation
   */
  overrideStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;

      if (user.role !== 'admin') {
        throw new UnauthorizedError(
          'You do not have permission to override manuscript status'
        );
      }

      const { manuscriptId } = req.params;
      const { status, reason, silentUpdate } =
        req.body as OverrideStatusRequest;

      const manuscript = await Manuscript.findById(manuscriptId).populate(
        'submitter coAuthors',
        'name email'
      );

      if (!manuscript) {
        throw new NotFoundError('Manuscript not found');
      }

      logger.warn(
        `ADMIN OVERRIDE: User ${user.id} is overriding manuscript ${manuscriptId} status from ${manuscript.status} to ${status}. Reason: ${reason}. Silent: ${silentUpdate}`
      );

      const oldStatus = manuscript.status;
      manuscript.status = status as any;

      if (!manuscript.reviewComments) {
        manuscript.reviewComments = {};
      }

      if (!(manuscript as any).overrideHistory) {
        (manuscript as any).overrideHistory = [];
      }

      (manuscript as any).overrideHistory.push({
        adminId: user.id,
        fromStatus: oldStatus,
        toStatus: status,
        reason,
        timestamp: new Date(),
        silentUpdate,
      });

      await manuscript.save();

      // NEW: Create Article if status is set to APPROVED
      if (status === ManuscriptStatus.APPROVED) {
        // Check if article already exists
        const existingArticle = await Article.findOne({
          manuscriptId: manuscript._id,
        });

        if (!existingArticle) {
          const newArticle = new Article({
            title: manuscript.title,
            abstract: manuscript.abstract,
            keywords: manuscript.keywords,
            pdfFile: manuscript.revisedPdfFile || manuscript.pdfFile,
            author: manuscript.submitter,
            coAuthors: manuscript.coAuthors,
            manuscriptId: manuscript._id,
            // Default options - not published yet
            publicationOptions: {
              doiEnabled: false,
              internetArchiveEnabled: false,
              emailNotificationEnabled: false,
            },
          });

          try {
            await newArticle.save();
            logger.info(
              `Article created from overridden manuscript ${manuscriptId} via admin override`
            );
          } catch (saveError: any) {
            // Handle duplicate key error gracefully
            if (saveError.code !== 11000) {
              throw saveError;
            }
            logger.warn(
              `Article already exists for manuscript ${manuscriptId}, skipping creation`
            );
          }
        } else {
          logger.info(
            `Article already exists for manuscript ${manuscriptId}, skipping creation`
          );
        }
      }

      // Send notification email unless silent update
      if (!silentUpdate) {
        const submitter = manuscript.submitter as any as IUser;
        try {
          await emailService.sendManuscriptStatusUpdateEmail(
            submitter.email,
            submitter.name,
            manuscript.title,
            manuscript.status as ManuscriptStatus
          );
        } catch (error) {
          logger.error('Failed to send status update email:', error);
        }
      }

      logger.info(
        `Manuscript ${manuscriptId} status overridden from ${oldStatus} to ${status} by admin ${user.id}`
      );

      res.status(200).json({
        success: true,
        message: 'Manuscript status overridden successfully',
        data: {
          manuscriptId: manuscript._id,
          oldStatus,
          newStatus: status,
          overrideBy: user.id,
          reason,
        },
      });
    }
  );

  /**
   * Get override history for a manuscript
   */
  getOverrideHistory = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;

      if (user.role !== 'admin') {
        throw new UnauthorizedError(
          'You do not have permission to view override history'
        );
      }

      const { manuscriptId } = req.params;

      const manuscript = await Manuscript.findById(manuscriptId);

      if (!manuscript) {
        throw new NotFoundError('Manuscript not found');
      }

      const overrideHistory = (manuscript as any).overrideHistory || [];

      res.status(200).json({
        success: true,
        data: {
          manuscriptId: manuscript._id,
          manuscriptTitle: manuscript.title,
          currentStatus: manuscript.status,
          overrideHistory,
        },
      });
    }
  );
}

export default new OverrideDecisionController();
