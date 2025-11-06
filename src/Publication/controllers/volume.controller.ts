import { Request, Response } from 'express';
import Volume, { IVolume } from '../models/volume.model';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import path from 'path';
import fs from 'fs';

interface AdminAuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

class VolumeController {
  // Create a new volume
  createVolume = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { volumeNumber, year, description, publishDate } = req.body;

      // Check if volume number already exists
      const existingVolume = await Volume.findOne({ volumeNumber });
      if (existingVolume) {
        throw new BadRequestError(`Volume ${volumeNumber} already exists`);
      }

      const volume = new Volume({
        volumeNumber,
        year,
        description,
        publishDate: publishDate || new Date(),
      });

      // Handle cover image upload
      if (req.file) {
        volume.coverImage = `${process.env.API_URL || 'http://localhost:3000'}/uploads/volume_covers/${req.file.filename}`;
      }

      await volume.save();

      logger.info(`Admin ${user.id} created volume ${volumeNumber}`);

      res.status(201).json({
        success: true,
        message: 'Volume created successfully',
        data: volume,
      });
    }
  );

  // Get all volumes
  getVolumes = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { page = 1, limit = 20, isActive } = req.query;

      const query: any = {};
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const volumes = await Volume.find(query)
        .sort({ volumeNumber: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Volume.countDocuments(query);

      res.status(200).json({
        success: true,
        count: volumes.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: volumes,
      });
    }
  );

  // Get volume by ID
  getVolumeById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const volume = await Volume.findById(id);

      if (!volume) {
        throw new NotFoundError('Volume not found');
      }

      res.status(200).json({
        success: true,
        data: volume,
      });
    }
  );

  // Update volume
  updateVolume = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { id } = req.params;
      const { volumeNumber, year, description, publishDate, isActive } =
        req.body;

      const volume = await Volume.findById(id);

      if (!volume) {
        throw new NotFoundError('Volume not found');
      }

      // Check if new volume number conflicts with existing
      if (volumeNumber && volumeNumber !== volume.volumeNumber) {
        const existingVolume = await Volume.findOne({ volumeNumber });
        if (existingVolume) {
          throw new BadRequestError(`Volume ${volumeNumber} already exists`);
        }
        volume.volumeNumber = volumeNumber;
      }

      if (year) volume.year = year;
      if (description !== undefined) volume.description = description;
      if (publishDate) volume.publishDate = new Date(publishDate);
      if (isActive !== undefined) volume.isActive = isActive;

      // Handle cover image upload
      if (req.file) {
        // Delete old cover image if exists
        if (volume.coverImage) {
          const oldFilePath = path.join(
            process.cwd(),
            'src',
            volume.coverImage.replace(
              process.env.API_URL || 'http://localhost:3000',
              ''
            )
          );
          try {
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          } catch (err) {
            logger.error(`Error deleting old cover image: ${err}`);
          }
        }
        volume.coverImage = `${process.env.API_URL || 'http://localhost:3000'}/uploads/volume_covers/${req.file.filename}`;
      }

      await volume.save();

      logger.info(`Admin ${user.id} updated volume ${id}`);

      res.status(200).json({
        success: true,
        message: 'Volume updated successfully',
        data: volume,
      });
    }
  );

  // Delete volume
  deleteVolume = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as AdminAuthenticatedRequest).user;
      const { id } = req.params;

      const volume = await Volume.findById(id);

      if (!volume) {
        throw new NotFoundError('Volume not found');
      }

      // Check if volume has issues (prevent deletion if it does)
      const Issue = require('../models/issue.model').default;
      const issueCount = await Issue.countDocuments({ volume: id });

      if (issueCount > 0) {
        throw new BadRequestError(
          'Cannot delete volume with existing issues. Delete issues first.'
        );
      }

      // Delete cover image if exists
      if (volume.coverImage) {
        const filePath = path.join(
          process.cwd(),
          'src',
          volume.coverImage.replace(
            process.env.API_URL || 'http://localhost:3000',
            ''
          )
        );
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          logger.error(`Error deleting cover image: ${err}`);
        }
      }

      await Volume.findByIdAndDelete(id);

      logger.info(`Admin ${user.id} deleted volume ${id}`);

      res.status(200).json({
        success: true,
        message: 'Volume deleted successfully',
      });
    }
  );
}

export default new VolumeController();
