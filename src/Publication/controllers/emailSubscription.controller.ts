import { Request, Response } from 'express';
import crypto from 'crypto';
import EmailSubscriber from '../models/emailSubscriber.model';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import emailService from '../../services/email.service';

class EmailSubscriptionController {
  // Subscribe to email alerts
  subscribe = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email } = req.body;

      if (!email) {
        throw new BadRequestError('Email is required');
      }

      // Check if already subscribed
      let subscriber = await EmailSubscriber.findOne({ email });

      if (subscriber) {
        if (subscriber.isActive) {
          res.status(200).json({
            success: true,
            message: 'You are already subscribed to email alerts',
          });
          return;
        } else {
          // Reactivate subscription
          subscriber.isActive = true;
          subscriber.subscribedAt = new Date();
          await subscriber.save();

          logger.info(`Reactivated email subscription: ${email}`);

          res.status(200).json({
            success: true,
            message: 'Your subscription has been reactivated',
          });
          return;
        }
      }

      // Create new subscriber
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      subscriber = new EmailSubscriber({
        email,
        unsubscribeToken,
        isActive: true,
      });

      await subscriber.save();

      // Send confirmation email
      try {
        await emailService.sendSubscriptionConfirmationEmail(
          email,
          unsubscribeToken
        );
      } catch (error) {
        logger.error('Failed to send confirmation email:', error);
        // Don't throw error, subscription is still created
      }

      logger.info(`New email subscription: ${email}`);

      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to email alerts',
      });
    }
  );

  // Unsubscribe from email alerts
  unsubscribe = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { token } = req.params;

      const subscriber = await EmailSubscriber.findOne({
        unsubscribeToken: token,
      });

      if (!subscriber) {
        throw new NotFoundError('Invalid unsubscribe link');
      }

      subscriber.isActive = false;
      await subscriber.save();

      logger.info(`Unsubscribed: ${subscriber.email}`);

      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from email alerts',
      });
    }
  );

  // Admin: Get all subscribers
  getSubscribers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { page = 1, limit = 50, isActive } = req.query;

      const query: any = {};
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const subscribers = await EmailSubscriber.find(query)
        .sort({ subscribedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await EmailSubscriber.countDocuments(query);

      res.status(200).json({
        success: true,
        count: subscribers.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: subscribers,
      });
    }
  );

  // Admin: Get subscriber statistics
  getStatistics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const totalSubscribers = await EmailSubscriber.countDocuments({
        isActive: true,
      });
      const inactiveSubscribers = await EmailSubscriber.countDocuments({
        isActive: false,
      });

      // Subscribers by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const subscribersByMonth = await EmailSubscriber.aggregate([
        {
          $match: {
            subscribedAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$subscribedAt' },
              month: { $month: '$subscribedAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalActive: totalSubscribers,
          totalInactive: inactiveSubscribers,
          subscribersByMonth,
        },
      });
    }
  );
}

export default new EmailSubscriptionController();
