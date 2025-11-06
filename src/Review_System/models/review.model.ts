import mongoose, { Document, Schema, Types } from 'mongoose';
import { ReviewDecision } from '../../Manuscript_Submission/models/manuscript.model';

export const ReviewType = {
  HUMAN: 'human',
  RECONCILIATION: 'reconciliation',
} as const;

export type ReviewType = (typeof ReviewType)[keyof typeof ReviewType];

export const ReviewStatus = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
} as const;

export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export interface IScores {
  originality: number;
  methodology: number;
  clarity: number;
  relevance: number;
  literature: number;
  results: number;
  contribution: number;
}

export interface IReview extends Document {
  manuscript: Types.ObjectId;
  reviewer: Types.ObjectId;
  reviewType: ReviewType;
  scores: IScores;
  totalScore: number;
  comments: {
    commentsForAuthor?: string;
    confidentialCommentsToEditor?: string;
  };
  reviewDecision?: ReviewDecision;
  status: ReviewStatus;
  dueDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    manuscript: {
      type: Schema.Types.ObjectId,
      ref: 'Manuscript',
      required: [true, 'Manuscript reference is required'],
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewType: {
      type: String,
      enum: Object.values(ReviewType),
      required: [true, 'Review type is required'],
    },
    scores: {
      originality: { type: Number, default: 0 },
      methodology: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      literature: { type: Number, default: 0 },
      results: { type: Number, default: 0 },
      contribution: { type: Number, default: 0 },
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    comments: {
      commentsForAuthor: { type: String, trim: true },
      confidentialCommentsToEditor: { type: String, trim: true },
    },
    reviewDecision: {
      type: String,
      enum: Object.values(ReviewDecision),
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.IN_PROGRESS,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.pre<IReview>('save', function (next) {
  if (this.isModified('scores')) {
    this.totalScore =
      (this.scores.originality || 0) +
      (this.scores.methodology || 0) +
      (this.scores.clarity || 0) +
      (this.scores.relevance || 0) +
      (this.scores.literature || 0) +
      (this.scores.results || 0) +
      (this.scores.contribution || 0);
  }
  next();
});

ReviewSchema.statics.checkDiscrepancy = async function (
  manuscriptId: Types.ObjectId | string
): Promise<boolean> {
  const reviews = await this.find({
    manuscript: manuscriptId,
    reviewType: ReviewType.HUMAN,
    status: ReviewStatus.COMPLETED,
  });

  if (reviews.length < 2) {
    return false;
  }

  const [review1, review2] = reviews;
  return review1.reviewDecision !== review2.reviewDecision;
};

ReviewSchema.statics.getByManuscript = function (
  manuscriptId: Types.ObjectId | string
) {
  return this.find({ manuscript: manuscriptId })
    .populate('reviewer', 'name email')
    .sort({ createdAt: -1 });
};

ReviewSchema.statics.getPendingByReviewer = function (
  reviewerId: Types.ObjectId | string
) {
  return this.find({
    reviewer: reviewerId,
    status: { $in: [ReviewStatus.IN_PROGRESS, ReviewStatus.OVERDUE] },
  })
    .populate('manuscript', 'title abstract')
    .sort({ dueDate: 1 });
};

ReviewSchema.statics.getCompletedByReviewer = function (
  reviewerId: Types.ObjectId | string
) {
  return this.find({
    reviewer: reviewerId,
    status: ReviewStatus.COMPLETED,
  })
    .populate('manuscript', 'title abstract')
    .sort({ completedAt: -1 });
};

ReviewSchema.statics.updateOverdueReviews = async function () {
  const now = new Date();
  return this.updateMany(
    { status: ReviewStatus.IN_PROGRESS, dueDate: { $lt: now } },
    { $set: { status: ReviewStatus.OVERDUE } }
  );
};

export default mongoose.model<IReview>('Review', ReviewSchema, 'Reviews');
