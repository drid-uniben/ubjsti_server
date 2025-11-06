import { Request, Response } from 'express';
import FailedJob, { JobType } from '../models/failedJob.model';
import { NotFoundError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import agenda from '../../config/agenda';
import mongoose from 'mongoose';

interface AdminAuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

class FailedJobsController {
  // Get all failed jobs
  getFailedJobs = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { page = 1, limit = 20, jobType, resolved } = req.query;

      const query: any = {};
      if (jobType) query.jobType = jobType;
      if (resolved !== undefined) query.resolved = resolved === 'true';

      const failedJobs = await FailedJob.find(query)
        .populate('articleId', 'title doi')
        .sort({ lastAttemptAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await FailedJob.countDocuments(query);

      res.status(200).json({
        success: true,
        count: failedJobs.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: failedJobs,
      });
    }
  );

  // Get failed job by ID
  getFailedJobById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const failedJob = await FailedJob.findById(id).populate(
        'articleId',
        'title doi author'
      );

      if (!failedJob) {
        throw new NotFoundError('Failed job not found');
      }

      res.status(200).json({
        success: true,
        data: failedJob,
      });
    }
  );

  // Retry a specific failed job
  retryFailedJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { id } = req.params;

      const failedJob = await FailedJob.findById(id);

      if (!failedJob) {
        throw new NotFoundError('Failed job not found');
      }

      if (failedJob.resolved) {
        res.status(400).json({
          success: false,
          message: 'This job has already been resolved',
        });
        return;
      }

      // Update attempt count
      failedJob.attemptCount += 1;
      failedJob.lastAttemptAt = new Date();
      await failedJob.save();

      // Schedule the appropriate job based on type
      let jobName = '';
      switch (failedJob.jobType) {
        case JobType.DOI_REGISTRATION:
          jobName = 'register-doi';
          break;
        case JobType.INDEXING_METADATA:
          jobName = 'generate-indexing-metadata';
          break;
        case JobType.PRESERVATION:
          jobName = 'upload-to-archive';
          break;
        case JobType.EMAIL_NOTIFICATION:
          jobName = 'send-publication-notification';
          break;
      }

      await agenda.now(jobName, {
        articleId: failedJob.articleId.toString(),
        failedJobId: (failedJob._id as mongoose.Types.ObjectId).toString(),
        ...failedJob.data,
      });

      logger.info(
        `Admin ${user.id} retried failed job ${id} (${failedJob.jobType})`
      );

      res.status(200).json({
        success: true,
        message: 'Job retry scheduled successfully',
        data: failedJob,
      });
    }
  );

  // Retry all unresolved failed jobs
  retryAllFailedJobs = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;

      const failedJobs = await FailedJob.find({ resolved: false });

      let retriedCount = 0;

      for (const failedJob of failedJobs) {
        try {
          failedJob.attemptCount += 1;
          failedJob.lastAttemptAt = new Date();
          await failedJob.save();

          let jobName = '';
          switch (failedJob.jobType) {
            case JobType.DOI_REGISTRATION:
              jobName = 'register-doi';
              break;
            case JobType.INDEXING_METADATA:
              jobName = 'generate-indexing-metadata';
              break;
            case JobType.PRESERVATION:
              jobName = 'upload-to-archive';
              break;
            case JobType.EMAIL_NOTIFICATION:
              jobName = 'send-publication-notification';
              break;
          }

          await agenda.now(jobName, {
            articleId: failedJob.articleId.toString(),
            failedJobId: (failedJob._id as mongoose.Types.ObjectId).toString(),
            ...failedJob.data,
          });

          retriedCount++;
        } catch (error) {
          logger.error(`Failed to retry job ${failedJob._id}:`, error);
        }
      }

      logger.info(`Admin ${user.id} retried ${retriedCount} failed jobs`);

      res.status(200).json({
        success: true,
        message: `Successfully scheduled ${retriedCount} failed jobs for retry`,
        retriedCount,
      });
    }
  );

  // Mark failed job as resolved
  markAsResolved = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { id } = req.params;

      const failedJob = await FailedJob.findById(id);

      if (!failedJob) {
        throw new NotFoundError('Failed job not found');
      }

      failedJob.resolved = true;
      failedJob.resolvedAt = new Date();
      await failedJob.save();

      logger.info(`Admin ${user.id} marked failed job ${id} as resolved`);

      res.status(200).json({
        success: true,
        message: 'Failed job marked as resolved',
        data: failedJob,
      });
    }
  );

  // Get failed jobs statistics
  getStatistics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const totalFailed = await FailedJob.countDocuments({ resolved: false });
      const totalResolved = await FailedJob.countDocuments({ resolved: true });

      const failedByType = await FailedJob.aggregate([
        {
          $match: { resolved: false },
        },
        {
          $group: {
            _id: '$jobType',
            count: { $sum: 1 },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalFailed,
          totalResolved,
          failedByType,
        },
      });
    }
  );

  // Delete resolved failed jobs (cleanup)
  deleteResolvedJobs = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;

      const result = await FailedJob.deleteMany({ resolved: true });

      logger.info(
        `Admin ${user.id} deleted ${result.deletedCount} resolved failed jobs`
      );

      res.status(200).json({
        success: true,
        message: `Deleted ${result.deletedCount} resolved failed jobs`,
        deletedCount: result.deletedCount,
      });
    }
  );
}

export default new FailedJobsController();
