import { Request, Response } from 'express';
import Article, { ArticleType } from '../../Articles/model/article.model';
import Volume from '../models/volume.model';
import Issue from '../models/issue.model';
import User, { IUser } from '../../model/user.model';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import agenda from '../../config/agenda';
import path from 'path';
import mongoose from 'mongoose';

interface AdminAuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

class PublicationController {
  // Get manuscripts ready for publication (approved articles without published status)
  getManuscriptsForPublication = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { page = 1, limit = 20 } = req.query;

      // Find articles created from approved manuscripts that are not yet published
      const articles = await Article.find({
        isPublished: false,
        manuscriptId: { $exists: true },
      })
        .populate('manuscriptId', 'title abstract keywords status')
        .populate('author', 'name email affiliation')
        .populate('coAuthors', 'name email affiliation')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Article.countDocuments({
        isPublished: false,
        manuscriptId: { $exists: true },
      });

      res.status(200).json({
        success: true,
        count: articles.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: articles,
      });
    }
  );

  // Publish an article (from manuscript or manual)
  publishArticle = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { articleId } = req.params;
      const {
        volumeId,
        issueId,
        articleType,
        pages,
        publishDate,
        customDOI, // Optional: for migrating old articles with existing DOIs
      } = req.body;

      // Find the article
      const article = await Article.findById(articleId)
        .populate('author', 'name email affiliation orcid')
        .populate('coAuthors', 'name email affiliation orcid');

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      if (article.isPublished) {
        throw new BadRequestError('Article is already published');
      }

      // Verify volume and issue exist
      const volume = await Volume.findById(volumeId);
      if (!volume) {
        throw new NotFoundError('Volume not found');
      }

      const issue = await Issue.findById(issueId);
      if (!issue) {
        throw new NotFoundError('Issue not found');
      }

      // Verify issue belongs to volume
      if (issue.volume.toString() !== volumeId) {
        throw new BadRequestError(
          'Issue does not belong to the selected volume'
        );
      }

      // Update article with publication details
      article.volume = volumeId;
      article.issue = issueId;
      article.articleType = articleType || ArticleType.RESEARCH;

      if (pages) {
        article.pages = pages;
      }

      article.publishDate = publishDate ? new Date(publishDate) : new Date();
      article.isPublished = true;
      article.publishedAt = new Date();

      // If custom DOI provided (for old articles), use it
      if (customDOI) {
        article.doi = customDOI;
      }

      await article.save();

      // Get PDF file path
      const pdfPath = article.pdfFile.replace(
        process.env.API_URL || 'http://localhost:3000',
        ''
      );
      const fullPdfPath = path.join(process.cwd(), 'src', pdfPath);

      // Schedule background jobs for DOI registration and indexing
      // Only if no custom DOI (for new publications)
      if (!customDOI) {
        await agenda.now('publish-article', {
          articleId: (article._id as mongoose.Types.ObjectId).toString(),
          pdfPath: fullPdfPath,
        });
      }

      logger.info(`Admin ${user.id} published article ${articleId}`);

      res.status(200).json({
        success: true,
        message:
          'Article published successfully. DOI registration and indexing jobs queued.',
        data: article,
      });
    }
  );

  // Create and publish manual article (for special publications/migrations)
  createAndPublishManualArticle = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const {
        title,
        abstract,
        keywords,
        authorId,
        coAuthorIds,
        volumeId,
        issueId,
        articleType,
        pages,
        publishDate,
        customDOI,
      } = req.body;

      // Validate required fields
      if (!title || !abstract || !volumeId || !issueId || !authorId) {
        throw new BadRequestError('Missing required fields');
      }

      if (!req.file) {
        throw new BadRequestError('PDF file is required');
      }

      // Verify volume and issue
      const volume = await Volume.findById(volumeId);
      if (!volume) {
        throw new NotFoundError('Volume not found');
      }

      const issue = await Issue.findById(issueId);
      if (!issue) {
        throw new NotFoundError('Issue not found');
      }

      if (issue.volume.toString() !== volumeId) {
        throw new BadRequestError(
          'Issue does not belong to the selected volume'
        );
      }

      // Verify author
      const author = await User.findById(authorId);
      if (!author) {
        throw new NotFoundError('Author not found');
      }

      // Verify co-authors if provided
      let validCoAuthors: IUser[] = [];
      if (coAuthorIds && coAuthorIds.length > 0) {
        validCoAuthors = await User.find({
          _id: { $in: coAuthorIds },
        });

        if (validCoAuthors.length !== coAuthorIds.length) {
          throw new BadRequestError('One or more co-authors not found');
        }
      }

      const pdfFile = `${process.env.API_URL || 'http://localhost:3000'}/uploads/documents/${req.file.filename}`;

      // Create article
      const article = new Article({
        title,
        abstract,
        keywords: keywords || [],
        pdfFile,
        author: authorId,
        coAuthors: validCoAuthors.map((a) => a._id),
        volume: volumeId,
        issue: issueId,
        articleType: articleType || ArticleType.RESEARCH,
        pages,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        isPublished: true,
        publishedAt: new Date(),
      });

      // If custom DOI provided (for old articles), use it
      if (customDOI) {
        article.doi = customDOI;
      }

      await article.save();

      // Get PDF file path for background jobs
      const pdfPath = article.pdfFile.replace(
        process.env.API_URL || 'http://localhost:3000',
        ''
      );
      const fullPdfPath = path.join(process.cwd(), 'src', pdfPath);

      // Schedule background jobs (only if no custom DOI)
      if (!customDOI) {
        await agenda.now('publish-article', {
          articleId: (article._id as mongoose.Types.ObjectId).toString(),
          pdfPath: fullPdfPath,
        });
      }

      logger.info(
        `Admin ${user.id} created and published manual article ${article._id}`
      );

      res.status(201).json({
        success: true,
        message:
          'Article created and published successfully. DOI registration and indexing jobs queued.',
        data: article,
      });
    }
  );

  // Get published articles (for public view)
  getPublishedArticles = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        page = 1,
        limit = 20,
        volumeId,
        issueId,
        articleType,
      } = req.query;

      const query: any = { isPublished: true };
      if (volumeId) query.volume = volumeId;
      if (issueId) query.issue = issueId;
      if (articleType) query.articleType = articleType;

      const articles = await Article.find(query)
        .populate('author', 'name email affiliation')
        .populate('coAuthors', 'name email affiliation')
        .populate('volume', 'volumeNumber year coverImage')
        .populate('issue', 'issueNumber')
        .sort({ publishDate: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Article.countDocuments(query);

      res.status(200).json({
        success: true,
        count: articles.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: articles,
      });
    }
  );

  // Get single published article by ID
  getPublishedArticleById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const article = await Article.findOne({ _id: id, isPublished: true })
        .populate('author', 'name email affiliation orcid')
        .populate('coAuthors', 'name email affiliation orcid')
        .populate('volume', 'volumeNumber year coverImage')
        .populate('issue', 'issueNumber publishDate')
        .populate('manuscriptId', 'title');

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      res.status(200).json({
        success: true,
        data: article,
      });
    }
  );

  // Get articles by volume and issue (for archives page)
  getArticlesByVolumeAndIssue = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { volumeId, issueId } = req.params;

      const articles = await Article.find({
        volume: volumeId,
        issue: issueId,
        isPublished: true,
      })
        .populate('author', 'name email affiliation')
        .populate('coAuthors', 'name email affiliation')
        .sort({ pages: 1 }); // Sort by page number

      res.status(200).json({
        success: true,
        count: articles.length,
        data: articles,
      });
    }
  );

  // Get current issue (latest published issue with articles)
  getCurrentIssue = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // Find the most recent issue with published articles
      const latestIssue = await Issue.findOne({ isActive: true })
        .populate('volume', 'volumeNumber year coverImage')
        .sort({ publishDate: -1 });

      if (!latestIssue) {
        throw new NotFoundError('No published issue found');
      }

      const articles = await Article.find({
        issue: latestIssue._id,
        isPublished: true,
      })
        .populate('author', 'name email affiliation')
        .populate('coAuthors', 'name email affiliation')
        .sort({ pages: 1 });

      res.status(200).json({
        success: true,
        data: {
          issue: latestIssue,
          articles,
        },
      });
    }
  );

  // Get archives (all volumes with issues and article counts)
  getArchives = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const volumes = await Volume.find({ isActive: true }).sort({
        volumeNumber: -1,
      });

      const archiveData = await Promise.all(
        volumes.map(async (volume) => {
          const issues = await Issue.find({ volume: volume._id }).sort({
            issueNumber: 1,
          });

          const issuesWithCounts = await Promise.all(
            issues.map(async (issue) => {
              const articleCount = await Article.countDocuments({
                issue: issue._id,
                isPublished: true,
              });

              return {
                ...issue.toObject(),
                articleCount,
              };
            })
          );

          return {
            ...volume.toObject(),
            issues: issuesWithCounts,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: archiveData,
      });
    }
  );
}

export default new PublicationController();
