import { Request, Response } from 'express';
import User, { UserRole, IUser } from '../../model/user.model';
import Manuscript from '../../Manuscript_Submission/models/manuscript.model';
import Review, { ReviewStatus } from '../models/review.model';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import emailService from '../../services/email.service';
import { NotFoundError, BadRequestError } from '../../utils/customErrors';
import {
  getEligibleFacultiesForAutomaticAssignment,
  getFacultiesByChoice,
  getClusterByFaculty,
} from '../../utils/facultyClusters';
import mongoose from 'mongoose';

interface EligibleReviewer {
  _id: string;
  name: string;
  email: string;
  totalReviewsCount: number;
  completionRate: number;
  facultyTitle?: string;
  subcluster?: string;
  phoneNumber?: string;
  areaOfSpecialization?: string;
}

interface IReassignReviewResponse {
  success: boolean;
  message?: string;
  data?: any;
}

class ReassignReviewController {
  reassignReview = asyncHandler(
    async (
      req: Request<
        { reviewId: string },
        {},
        { assignmentType: 'automatic' | 'manual'; newReviewerId?: string }
      >,
      res: Response
    ) => {
      const { reviewId } = req.params;
      const { assignmentType, newReviewerId } = req.body;

      const review = await Review.findById(reviewId).populate('manuscript');
      if (!review) {
        throw new NotFoundError('Review not found');
      }

      const manuscript = review.manuscript as any;
      if (!manuscript) {
        throw new NotFoundError('Manuscript not found for this review');
      }
      if (manuscript.isArchived) {
        throw new BadRequestError(
          'Cannot reassign review for an archived manuscript.'
        );
      }

      const oldReviewerId = review.reviewer;
      let newReviewer: IUser | null = null;

      // Remove manuscript from old reviewer's assignedReviews
      const oldReviewer = await User.findById(oldReviewerId);
      if (oldReviewer && oldReviewer.assignedReviews) {
        oldReviewer.assignedReviews = oldReviewer.assignedReviews.filter(
          (id) => !id.equals(manuscript._id)
        );
        await oldReviewer.save();
      }

      if (assignmentType === 'manual') {
        if (!newReviewerId) {
          throw new BadRequestError(
            'New reviewer ID is required for manual reassignment.'
          );
        }
        newReviewer = await User.findById(newReviewerId);
        if (!newReviewer) {
          throw new NotFoundError('New reviewer not found.');
        }
        const newReviewerObjectId = newReviewer._id as mongoose.Types.ObjectId;
        if (review.reviewer.equals(newReviewerObjectId)) {
          throw new BadRequestError(
            'The new reviewer cannot be the same as the old reviewer.'
          );
        }
      } else {
        // Automatic
        const existingReviewerIds = (
          await Review.find({ manuscript: manuscript._id })
        ).map((r) => r.reviewer);

        const submitter = await User.findById(manuscript.submitter);
        if (!submitter || !submitter.assignedFaculty) {
          throw new NotFoundError('Submitter or submitter faculty not found');
        }
        const eligibleFaculties = getEligibleFacultiesForAutomaticAssignment(
          submitter.assignedFaculty as string
        );

        const eligibleReviewers = await User.find({
          role: UserRole.REVIEWER,
          isActive: true,
          assignedFaculty: { $in: eligibleFaculties },
          _id: { $nin: existingReviewerIds },
        }).sort({ 'reviews.length': 1 }); // simple workload sort

        if (eligibleReviewers.length === 0) {
          const allEligible = await this.getEligibleReviewers(
            manuscript._id.toString()
          );
          res.status(400).json({
            success: false,
            message:
              'Could not find an eligible reviewer automatically from the same sub-cluster. Please select one manually.',
            data: { eligibleReviewers: allEligible },
          });
          return;
        }
        newReviewer = eligibleReviewers[0];
      }

      if (!newReviewer) {
        throw new NotFoundError('Could not select a new reviewer.');
      }

      review.reviewer = newReviewer._id as mongoose.Types.ObjectId;
      review.status = ReviewStatus.IN_PROGRESS;
      review.dueDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000); // 3 weeks

      await review.save();

      // Add manuscript to new reviewer's assignedReviews
      if (newReviewer) {
        if (!newReviewer.assignedReviews) {
          newReviewer.assignedReviews = [];
        }
        newReviewer.assignedReviews.push(
          manuscript._id as mongoose.Types.ObjectId
        );
        await newReviewer.save();
      }

      try {
        await emailService.sendReviewAssignmentEmail(
          newReviewer.email,
          manuscript.title,
          newReviewer.name,
          review.dueDate
        );
      } catch (error) {
        logger.error('Failed to send review assignment email:', error);
      }
      res.status(200).json({
        success: true,
        message: 'Review reassigned successfully',
        data: { review, oldReviewerId },
      });
    }
  );

  getEligibleReviewers = async (manuscriptId: string) => {
    const manuscript =
      await Manuscript.findById(manuscriptId).populate('submitter');
    if (!manuscript) {
      throw new NotFoundError('Manuscript not found');
    }
    if (manuscript.isArchived) {
      throw new NotFoundError('Manuscript not found or is archived');
    }
    const submitter = manuscript.submitter as any;
    const submitterFaculty = submitter.assignedFaculty;

    if (!submitterFaculty) {
      return { firstChoice: [], secondChoice: [] };
    }

    const { firstChoice, secondChoice } =
      getFacultiesByChoice(submitterFaculty);
    const existingReviewerIds = (
      await Review.find({ manuscript: manuscriptId })
    ).map((r) => r.reviewer);

    const findReviewersByFaculty = async (faculties: string[]) => {
      const reviewers = await User.find({
        role: UserRole.REVIEWER,
        isActive: true,
        assignedFaculty: { $in: faculties },
        _id: { $nin: existingReviewerIds },
      }).lean(); // Use .lean() for performance

      return reviewers.map((r) => ({
        ...r,
        subcluster: getClusterByFaculty(r.assignedFaculty as string) || 'N/A',
      }));
    };

    const firstChoiceReviewers = await findReviewersByFaculty(firstChoice);
    const secondChoiceReviewers = await findReviewersByFaculty(secondChoice);

    // Admins are always second choice
    const adminReviewers = await User.find({
      role: UserRole.ADMIN,
      isActive: true,
      _id: { $nin: existingReviewerIds },
    }).lean();
    const adminsWithSubcluster = adminReviewers.map((r) => ({
      ...r,
      subcluster: 'N/A',
    }));

    return {
      firstChoice: firstChoiceReviewers,
      secondChoice: [...secondChoiceReviewers, ...adminsWithSubcluster],
    };
  };

  getEligibleReviewersEndpoint = asyncHandler(
    async (req: Request, res: Response) => {
      const reviewers = await this.getEligibleReviewers(
        req.params.manuscriptId
      );
      res.status(200).json({
        success: true,
        data: reviewers,
      });
    }
  );

  getExistingReviewers = asyncHandler(async (req: Request, res: Response) => {
    const { manuscriptId } = req.params;

    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript) {
      throw new NotFoundError('Manuscript not found');
    }
    if (manuscript.isArchived) {
      throw new NotFoundError('Manuscript not found or is archived');
    }
    const reviews = await Review.find({ manuscript: manuscriptId }).populate(
      'reviewer',
      'name email role phoneNumber areaOfSpecialization'
    );
    res.status(200).json({
      success: true,
      data: {
        manuscriptStatus: manuscript.status,
        reviews: reviews.map((r) => ({
          reviewId: r._id,
          reviewType: r.reviewType,
          status: r.status,
          dueDate: r.dueDate,
          reviewer: r.reviewer,
        })),
      },
    });
  });

  getEligibleReviewersForRevised = asyncHandler(
    async (req: Request, res: Response) => {
      const { manuscriptId } = req.params;

      const manuscript =
        await Manuscript.findById(manuscriptId).populate('originalReviewer');
      if (!manuscript) {
        throw new NotFoundError('Manuscript not found');
      }
      if (manuscript.isArchived) {
        throw new NotFoundError('Manuscript not found or is archived');
      }

      // For revised manuscripts, only show admin and original reviewer
      if (manuscript.revisedPdfFile) {
        const eligibleReviewers: EligibleReviewer[] = [];

        // Add admin
        const admin: IUser | null = await User.findOne({
          role: UserRole.ADMIN,
          isActive: true,
        });
        if (admin) {
          const reviewCount = await Review.countDocuments({
            reviewer: admin._id,
          });
          const completedCount = await Review.countDocuments({
            reviewer: admin._id,
            status: ReviewStatus.COMPLETED,
          });
          eligibleReviewers.push({
            _id: (admin._id as mongoose.Types.ObjectId).toString(),
            name: admin.name,
            email: admin.email,
            phoneNumber: admin.phoneNumber,
            areaOfSpecialization: admin.areaOfSpecialization,
            totalReviewsCount: reviewCount,
            completionRate:
              reviewCount > 0 ? (completedCount / reviewCount) * 100 : 0,
            subcluster: 'N/A',
          });
        }

        // Add original reviewer if exists
        if (manuscript.originalReviewer) {
          const reviewer: IUser | null = await User.findById(
            manuscript.originalReviewer
          );
          if (reviewer) {
            const reviewCount = await Review.countDocuments({
              reviewer: reviewer._id,
            });
            const completedCount = await Review.countDocuments({
              reviewer: reviewer._id,
              status: ReviewStatus.COMPLETED,
            });

            eligibleReviewers.push({
              _id: (reviewer._id as mongoose.Types.ObjectId).toString(),
              name: reviewer.name,
              email: reviewer.email,
              facultyTitle: reviewer.faculty,
              phoneNumber: reviewer.phoneNumber,
              areaOfSpecialization: reviewer.areaOfSpecialization,
              totalReviewsCount: reviewCount,
              completionRate:
                reviewCount > 0 ? (completedCount / reviewCount) * 100 : 0,
              subcluster:
                getClusterByFaculty(reviewer.assignedFaculty as string) ||
                'N/A',
            });
          }
        }

        res.status(200).json({
          success: true,
          data: eligibleReviewers,
        });
      } else {
        // Regular manuscript - use existing logic
        const reviewers = await this.getEligibleReviewers(manuscriptId);
        res.status(200).json({
          success: true,
          data: reviewers,
        });
      }
    }
  );
}
export default new ReassignReviewController();
