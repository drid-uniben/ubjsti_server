import { Request, Response } from 'express';
import Issue, { IIssue } from '../models/issue.model';
import Volume from '../models/volume.model';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';

interface AdminAuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

class IssueController {
  // Create a new issue
  createIssue = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { volume, issueNumber, description, publishDate } = req.body;

      // Check if volume exists
      const volumeExists = await Volume.findById(volume);
      if (!volumeExists) {
        throw new NotFoundError('Volume not found');
      }

      // Check if issue number already exists for this volume
      const existingIssue = await Issue.findOne({ volume, issueNumber });
      if (existingIssue) {
        throw new BadRequestError(
          `Issue ${issueNumber} already exists for this volume`
        );
      }

      const issue = new Issue({
        volume,
        issueNumber,
        description,
        publishDate: publishDate || new Date(),
      });

      await issue.save();

      logger.info(
        `Admin ${user.id} created issue ${issueNumber} for volume ${volume}`
      );

      res.status(201).json({
        success: true,
        message: 'Issue created successfully',
        data: issue,
      });
    }
  );

  // Get all issues
  getIssues = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { page = 1, limit = 20, volume, isActive } = req.query;

      const query: any = {};
      if (volume) query.volume = volume;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const issues = await Issue.find(query)
        .populate('volume', 'volumeNumber year coverImage')
        .sort({ publishDate: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Issue.countDocuments(query);

      res.status(200).json({
        success: true,
        count: issues.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: issues,
      });
    }
  );

  // Get issue by ID
  getIssueById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const issue = await Issue.findById(id).populate(
        'volume',
        'volumeNumber year coverImage'
      );

      if (!issue) {
        throw new NotFoundError('Issue not found');
      }

      res.status(200).json({
        success: true,
        data: issue,
      });
    }
  );

  // Get issues by volume
  getIssuesByVolume = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { volumeId } = req.params;

      const issues = await Issue.find({ volume: volumeId }).sort({
        issueNumber: 1,
      });

      res.status(200).json({
        success: true,
        count: issues.length,
        data: issues,
      });
    }
  );

  // Update issue
  updateIssue = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { id } = req.params;
      const { issueNumber, description, publishDate, isActive } = req.body;

      const issue = await Issue.findById(id);

      if (!issue) {
        throw new NotFoundError('Issue not found');
      }

      // Check if new issue number conflicts with existing
      if (issueNumber && issueNumber !== issue.issueNumber) {
        const existingIssue = await Issue.findOne({
          volume: issue.volume,
          issueNumber,
        });
        if (existingIssue) {
          throw new BadRequestError(
            `Issue ${issueNumber} already exists for this volume`
          );
        }
        issue.issueNumber = issueNumber;
      }

      if (description !== undefined) issue.description = description;
      if (publishDate) issue.publishDate = new Date(publishDate);
      if (isActive !== undefined) issue.isActive = isActive;

      await issue.save();

      logger.info(`Admin ${user.id} updated issue ${id}`);

      res.status(200).json({
        success: true,
        message: 'Issue updated successfully',
        data: issue,
      });
    }
  );

  // Delete issue
  deleteIssue = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { id } = req.params;

      const issue = await Issue.findById(id);

      if (!issue) {
        throw new NotFoundError('Issue not found');
      }

      // Check if issue has articles (prevent deletion if it does)
      const Article = require('../../Articles/model/article.model').default;
      const articleCount = await Article.countDocuments({ issue: id });

      if (articleCount > 0) {
        throw new BadRequestError(
          'Cannot delete issue with published articles. Unpublish articles first.'
        );
      }

      await Issue.findByIdAndDelete(id);

      logger.info(`Admin ${user.id} deleted issue ${id}`);

      res.status(200).json({
        success: true,
        message: 'Issue deleted successfully',
      });
    }
  );
}

export default new IssueController();
