import { Request, Response } from 'express';
import Article from '../../Articles/model/article.model';
import { NotFoundError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import citationService from '../services/citation.service';
import indexingService from '../services/indexing.service';

class CitationController {
  // Generate citation in specified format
  getCitation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { format = 'apa' } = req.query;

      const article = await Article.findOne({ _id: id, isPublished: true })
        .populate('author', 'name affiliation')
        .populate('coAuthors', 'name affiliation')
        .populate('volume')
        .populate('issue');

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      const authors = [article.author, ...(article.coAuthors || [])] as any[];

      const volume = article.volume as any;
      const issue = article.issue as any;

      let citation = '';

      switch (format.toString().toLowerCase()) {
        case 'apa':
          citation = citationService.generateAPA(
            article,
            authors,
            volume,
            issue
          );
          break;
        case 'mla':
          citation = citationService.generateMLA(
            article,
            authors,
            volume,
            issue
          );
          break;
        case 'chicago':
          citation = citationService.generateChicago(
            article,
            authors,
            volume,
            issue
          );
          break;
        case 'harvard':
          citation = citationService.generateHarvard(
            article,
            authors,
            volume,
            issue
          );
          break;
        case 'bibtex':
          citation = citationService.generateBibTeX(
            article,
            authors,
            volume,
            issue
          );
          break;
        case 'ris':
          citation = citationService.generateRIS(
            article,
            authors,
            volume,
            issue
          );
          break;
        default:
          citation = citationService.generateAPA(
            article,
            authors,
            volume,
            issue
          );
      }

      res.status(200).json({
        success: true,
        format,
        citation,
      });
    }
  );

  // Download citation file (BibTeX or RIS)
  downloadCitation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { format = 'bibtex' } = req.query;

      const article = await Article.findOne({ _id: id, isPublished: true })
        .populate('author', 'name affiliation')
        .populate('coAuthors', 'name affiliation')
        .populate('volume')
        .populate('issue');

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      const authors = [article.author, ...(article.coAuthors || [])] as any[];

      const volume = article.volume as any;
      const issue = article.issue as any;

      let citation = '';
      let filename = '';
      let contentType = '';

      if (format === 'bibtex') {
        citation = citationService.generateBibTeX(
          article,
          authors,
          volume,
          issue
        );
        filename = `article_${article._id}.bib`;
        contentType = 'application/x-bibtex';
      } else if (format === 'ris') {
        citation = citationService.generateRIS(article, authors, volume, issue);
        filename = `article_${article._id}.ris`;
        contentType = 'application/x-research-info-systems';
      } else {
        throw new NotFoundError('Invalid format. Use bibtex or ris');
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.send(citation);
    }
  );

  // Get all available citation formats for an article
  getAllCitations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const article = await Article.findOne({ _id: id, isPublished: true })
        .populate('author', 'name affiliation')
        .populate('coAuthors', 'name affiliation')
        .populate('volume')
        .populate('issue');

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      const authors = [article.author, ...(article.coAuthors || [])] as any[];

      const volume = article.volume as any;
      const issue = article.issue as any;

      const citations = {
        apa: citationService.generateAPA(article, authors, volume, issue),
        mla: citationService.generateMLA(article, authors, volume, issue),
        chicago: citationService.generateChicago(
          article,
          authors,
          volume,
          issue
        ),
        harvard: citationService.generateHarvard(
          article,
          authors,
          volume,
          issue
        ),
        bibtex: citationService.generateBibTeX(article, authors, volume, issue),
        ris: citationService.generateRIS(article, authors, volume, issue),
      };

      res.status(200).json({
        success: true,
        data: citations,
      });
    }
  );

  // Get metadata for indexing (Google Scholar, JSON-LD, OAI-PMH)
  getIndexingMetadata = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { format = 'json-ld' } = req.query;

      const article = await Article.findOne({ _id: id, isPublished: true })
        .populate('author', 'name affiliation email')
        .populate('coAuthors', 'name affiliation email')
        .populate('volume')
        .populate('issue');

      if (!article) {
        throw new NotFoundError('Article not found');
      }

      const authors = [article.author, ...(article.coAuthors || [])] as any[];

      const volume = article.volume as any;
      const issue = article.issue as any;

      let metadata: any;

      switch (format.toString().toLowerCase()) {
        case 'google-scholar':
          metadata = indexingService.generateGoogleScholarMetaTags(
            article,
            authors,
            volume,
            issue
          );
          res.setHeader('Content-Type', 'text/html');
          res.send(metadata);
          return;

        case 'oai-pmh':
          metadata = indexingService.generateOAIPMHRecord(
            article,
            authors,
            volume,
            issue
          );
          res.setHeader('Content-Type', 'application/xml');
          res.send(metadata);
          return;

        case 'json-ld':
        default:
          metadata = indexingService.generateJSONLD(
            article,
            authors,
            volume,
            issue
          );
          res.setHeader('Content-Type', 'application/ld+json');
          res.send(metadata);
      }
    }
  );
}

export default new CitationController();
