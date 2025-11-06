import axios from 'axios';
import fs from 'fs';
import logger from '../../utils/logger';
import { IArticle } from '../../Articles/model/article.model';

interface InternetArchiveMetadata {
  title: string;
  creator: string;
  date: string;
  description: string;
  subject: string;
  mediatype: string;
  collection: string;
  language: string;
  licenseurl: string;
}

class InternetArchiveService {
  private accessKey: string;
  private secretKey: string;
  private baseUrl = 'https://s3.us.archive.org';

  constructor() {
    this.accessKey = process.env.INTERNET_ARCHIVE_ACCESS_KEY || '';
    this.secretKey = process.env.INTERNET_ARCHIVE_SECRET_KEY || '';

    if (!this.accessKey || !this.secretKey) {
      logger.warn(
        'Internet Archive credentials not set in environment variables'
      );
    }
  }

  /**
   * Build metadata for Internet Archive
   */
  private buildMetadata(
    article: IArticle,
    authors: any[]
  ): InternetArchiveMetadata {
    const authorNames = authors.map((a) => a.name).join('; ');

    return {
      title: article.title,
      creator: authorNames,
      date: article.publishDate.toISOString().split('T')[0],
      description: article.abstract,
      subject: article.keywords.join('; '),
      mediatype: 'texts',
      collection: 'opensource', // Or your specific collection
      language: 'eng',
      licenseurl: 'https://creativecommons.org/licenses/by/4.0/',
    };
  }

  /**
   * Upload article to Internet Archive
   */
  async uploadArticle(
    article: IArticle,
    authors: any[],
    pdfPath: string
  ): Promise<string> {
    try {
      // Generate unique identifier for Internet Archive
      const identifier = `uniben-jh-${article._id}`;

      // Build metadata
      const metadata = this.buildMetadata(article, authors);

      // Read PDF file
      const fileBuffer = fs.readFileSync(pdfPath);

      // Upload to Internet Archive using S3-compatible API
      const uploadUrl = `${this.baseUrl}/${identifier}/${identifier}.pdf`;

      // Create headers with metadata
      const headers: any = {
        'x-amz-auto-make-bucket': '1',
        'x-archive-meta-mediatype': metadata.mediatype,
        'x-archive-meta-collection': metadata.collection,
        'x-archive-meta-title': metadata.title,
        'x-archive-meta-creator': metadata.creator,
        'x-archive-meta-date': metadata.date,
        'x-archive-meta-description': metadata.description,
        'x-archive-meta-subject': metadata.subject,
        'x-archive-meta-language': metadata.language,
        'x-archive-meta-licenseurl': metadata.licenseurl,
        authorization: `LOW ${this.accessKey}:${this.secretKey}`,
      };

      await axios.put(uploadUrl, fileBuffer, { headers });

      const archiveUrl = `https://archive.org/details/${identifier}`;
      logger.info(`Uploaded article to Internet Archive: ${archiveUrl}`);

      return archiveUrl;
    } catch (error: any) {
      logger.error('Failed to upload to Internet Archive:', error.message);
      throw new Error(`Internet Archive upload failed: ${error.message}`);
    }
  }
}

export default new InternetArchiveService();
