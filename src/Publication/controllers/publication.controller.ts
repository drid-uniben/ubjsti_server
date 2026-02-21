/* eslint-disable max-lines */
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
import fs from 'fs';
import mongoose, { Types } from 'mongoose';

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
        customDOI,
        // NEW: Publication options
        doiEnabled = false,
        internetArchiveEnabled = false,
        emailNotificationEnabled = false,
      } = req.body;

      const article = await Article.findById(articleId)
        .populate('author', 'name email affiliation orcid')
        .populate('coAuthors', 'name email affiliation orcid');

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      if (article.isPublished) {
        throw new BadRequestError('Article is already published');
      }

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

      // Store publication options
      article.publicationOptions = {
        doiEnabled,
        internetArchiveEnabled,
        emailNotificationEnabled,
      };

      // Handle custom DOI
      if (customDOI) {
        article.doi = customDOI;
      }

      await article.save();

      const pdfPath = article.pdfFile.replace(
        process.env.API_URL || 'http://localhost:3000',
        ''
      );
      const baseDir = process.env.NODE_ENV === 'production' ? 'dist' : 'src';
      const fullPdfPath = path.join(process.cwd(), baseDir, pdfPath);

      // Schedule background jobs based on options
      if (!customDOI) {
        // Always generate metadata (Google Scholar, BASE, CORE, SEO)
        await agenda.now('generate-indexing-metadata', {
          articleId: (article._id as mongoose.Types.ObjectId).toString(),
        });

        // Conditionally schedule DOI registration
        if (doiEnabled) {
          await agenda.now('register-doi', {
            articleId: (article._id as mongoose.Types.ObjectId).toString(),
            pdfPath: fullPdfPath,
          });
        }

        // Conditionally schedule Internet Archive upload
        if (internetArchiveEnabled) {
          await agenda.now('upload-to-archive', {
            articleId: (article._id as mongoose.Types.ObjectId).toString(),
            pdfPath: fullPdfPath,
          });
        }

        // Conditionally schedule email notifications
        if (emailNotificationEnabled) {
          await agenda.now('send-publication-notification', {
            articleId: (article._id as mongoose.Types.ObjectId).toString(),
          });
        }
      }

      logger.info(`Admin ${user.id} published article ${articleId}`);

      res.status(200).json({
        success: true,
        message: 'Article published successfully',
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
        // NEW: Publication options
        doiEnabled = false,
        internetArchiveEnabled = false,
        emailNotificationEnabled = false,
      } = req.body;

      if (!title || !abstract || !volumeId || !issueId || !authorId) {
        throw new BadRequestError('Missing required fields');
      }

      if (!req.file) {
        throw new BadRequestError('PDF file is required');
      }

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

      const author = await User.findById(authorId);
      if (!author) {
        throw new NotFoundError('Author not found');
      }

      let validCoAuthors: IUser[] = [];
      if (coAuthorIds && Array.isArray(coAuthorIds) && coAuthorIds.length > 0) {
        // Filter out empty strings and ensure all are valid strings
        const validIds = coAuthorIds.filter(
          (id) => id && typeof id === 'string' && id.trim()
        );

        if (validIds.length > 0) {
          validCoAuthors = await User.find({
            _id: { $in: validIds },
          });

          if (validCoAuthors.length !== validIds.length) {
            throw new BadRequestError('One or more co-authors not found');
          }
        }
      }

      const pdfFile = `${process.env.API_URL || 'http://localhost:3000'}/uploads/manual_articles/${req.file.filename}`;

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
        publicationOptions: {
          doiEnabled,
          internetArchiveEnabled,
          emailNotificationEnabled,
        },
      });

      if (customDOI) {
        article.doi = customDOI;
      }

      await article.save();

      const pdfPath = article.pdfFile.replace(
        process.env.API_URL || 'http://localhost:3000',
        ''
      );
      const baseDir = process.env.NODE_ENV === 'production' ? 'dist' : 'src';
      const fullPdfPath = path.join(process.cwd(), baseDir, pdfPath);

      // Schedule jobs based on options (same logic as publishArticle)
      if (!customDOI) {
        await agenda.now('generate-indexing-metadata', {
          articleId: (article._id as mongoose.Types.ObjectId).toString(),
        });

        if (doiEnabled) {
          await agenda.now('register-doi', {
            articleId: (article._id as mongoose.Types.ObjectId).toString(),
            pdfPath: fullPdfPath,
          });
        }

        if (internetArchiveEnabled) {
          await agenda.now('upload-to-archive', {
            articleId: (article._id as mongoose.Types.ObjectId).toString(),
            pdfPath: fullPdfPath,
          });
        }

        if (emailNotificationEnabled) {
          await agenda.now('send-publication-notification', {
            articleId: (article._id as mongoose.Types.ObjectId).toString(),
          });
        }
      }

      logger.info(
        `Admin ${user.id} created and published manual article ${article._id}`
      );

      res.status(201).json({
        success: true,
        message: 'Article created and published successfully',
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
  // Add search method to PublicationController class
  searchArticles = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        query,
        limit = 10,
        volumeId,
        issueId,
        volumeNumber,
        issueNumber,
        articleType,
      } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
          data: [],
        });
        return;
      }

      const searchRegex = new RegExp(query.trim(), 'i');

      // 1. Find matching authors/co-authors IDs if query matches their name
      const matchingUsers = await User.find({
        name: searchRegex,
      }).select('_id');
      const matchingUserIds = matchingUsers.map((u) => u._id);

      // 2. Build the article query
      const articleQuery: any = {
        isPublished: true,
        $or: [
          { title: searchRegex },
          { abstract: searchRegex },
          { keywords: searchRegex },
          { doi: searchRegex },
          { author: { $in: matchingUserIds } },
          { coAuthors: { $in: matchingUserIds } },
        ],
      };

      // 3. Handle optional ID filters
      if (
        volumeId &&
        typeof volumeId === 'string' &&
        Types.ObjectId.isValid(volumeId)
      ) {
        articleQuery.volume = new Types.ObjectId(volumeId);
      }
      if (
        issueId &&
        typeof issueId === 'string' &&
        Types.ObjectId.isValid(issueId)
      ) {
        articleQuery.issue = new Types.ObjectId(issueId);
      }

      // 4. Handle Volume/Issue Number filters (if ID filters are not provided)
      if (!articleQuery.volume && volumeNumber) {
        const volume = await Volume.findOne({
          volumeNumber: parseInt(volumeNumber as string, 10),
        });
        if (volume) {
          articleQuery.volume = volume._id;
        } else {
          // If volume number specified but not found, return empty results early
          res.status(200).json({ success: true, count: 0, data: [] });
          return;
        }
      }

      if (!articleQuery.issue && issueNumber) {
        const issueQuery: any = {
          issueNumber: parseInt(issueNumber as string, 10),
        };
        if (articleQuery.volume) {
          issueQuery.volume = articleQuery.volume;
        }

        const issue = await Issue.findOne(issueQuery);
        if (issue) {
          articleQuery.issue = issue._id;
        } else {
          // If issue number specified but not found, return empty results early
          res.status(200).json({ success: true, count: 0, data: [] });
          return;
        }
      }

      if (articleType && typeof articleType === 'string') {
        articleQuery.articleType = articleType;
      }

      const articles = await Article.find(articleQuery)
        .populate('author', 'name email affiliation')
        .populate('coAuthors', 'name email affiliation')
        .populate('volume', 'volumeNumber year')
        .populate('issue', 'issueNumber')
        .limit(parseInt(limit as string, 10))
        .select(
          '_id title abstract doi volume issue author coAuthors articleType publishDate'
        )
        .sort({ publishDate: -1 })
        .lean();

      logger.info(
        `Article search performed: "${query}" - ${articles.length} results (Filters: ${JSON.stringify({ volumeId, issueId, volumeNumber, issueNumber, articleType })})`
      );

      res.status(200).json({
        success: true,
        count: articles.length,
        data: articles,
      });
    }
  );

  // ── Get manually published articles (no manuscriptId) ─────────────
  getManualArticles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const query = { isPublished: true, manuscriptId: { $exists: false } };

    const articles = await Article.find(query)
      .populate('author', 'name email')
      .populate('coAuthors', 'name email')
      .populate('volume', 'volumeNumber year')
      .populate('issue', 'issueNumber publishDate')
      .sort({ publishDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Article.countDocuments(query);

    res
      .status(200)
      .json({ success: true, count: articles.length, total, data: articles });
  });

  // ── Update a manually published article ───────────────────────────
  updateManualArticle = asyncHandler(async (req, res) => {
    const user = (req as AdminAuthenticatedRequest).user;
    const { id } = req.params;
    const {
      title,
      abstract,
      keywords,
      articleType,
      pageStart,
      pageEnd,
      publishDate,
    } = req.body;

    const article = await Article.findById(id);
    if (!article) throw new NotFoundError('Article not found');
    if (article.manuscriptId)
      throw new BadRequestError(
        'Cannot edit articles from submission workflow here'
      );

    const API = process.env.API_URL || 'http://localhost:3000';

    if (title) article.title = title;
    if (abstract) article.abstract = abstract;
    if (keywords !== undefined) {
      article.keywords =
        typeof keywords === 'string'
          ? keywords
              .split(',')
              .map((k: string) => k.trim())
              .filter(Boolean)
          : keywords;
    }
    if (articleType) article.articleType = articleType;
    if (pageStart && pageEnd) {
      article.pages = { start: parseInt(pageStart), end: parseInt(pageEnd) };
    }
    if (publishDate) article.publishDate = new Date(publishDate);

    if (req.file) {
      if (article.pdfFile && article.pdfFile.trim()) {
        const baseDir = process.env.NODE_ENV === 'production' ? 'dist' : 'src';
        const oldPath = path.join(
          process.cwd(),
          baseDir,
          article.pdfFile.replace(API, '')
        );
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          logger.error(`Error deleting old PDF: ${err}`);
        }
      }
      article.pdfFile = `${API}/uploads/manual_articles/${req.file.filename}`;
    }

    await article.save();
    logger.info(`Admin ${user.id} updated manual article ${id}`);
    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: article,
    });
  });

  // ── Delete a manually published article ───────────────────────────
  deleteManualArticle = asyncHandler(async (req, res) => {
    const user = (req as AdminAuthenticatedRequest).user;
    const { id } = req.params;

    const article = await Article.findById(id);
    if (!article) throw new NotFoundError('Article not found');
    if (article.manuscriptId)
      throw new BadRequestError(
        'Cannot delete articles from the submission workflow'
      );

    const API = process.env.API_URL || 'http://localhost:3000';
    if (article.pdfFile && article.pdfFile.trim()) {
      const baseDir = process.env.NODE_ENV === 'production' ? 'dist' : 'src';
      const filePath = path.join(
        process.cwd(),
        baseDir,
        article.pdfFile.replace(API, '')
      );
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        logger.error(`Error deleting PDF: ${err}`);
      }
    }

    await Article.findByIdAndDelete(id);
    logger.info(`Admin ${user.id} deleted manual article ${id}`);
    res
      .status(200)
      .json({ success: true, message: 'Article deleted successfully' });
  });
}

export default new PublicationController();
