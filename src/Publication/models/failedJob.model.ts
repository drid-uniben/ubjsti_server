import mongoose, { Document, Schema, Types } from 'mongoose';

export enum JobType {
  DOI_REGISTRATION = 'doi_registration',
  INDEXING_METADATA = 'indexing_metadata',
  PRESERVATION = 'preservation',
  EMAIL_NOTIFICATION = 'email_notification',
}

export interface IFailedJob extends Document {
  jobType: JobType;
  articleId: Types.ObjectId;
  errorMessage: string;
  errorStack?: string;
  attemptCount: number;
  lastAttemptAt: Date;
  data?: any;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

const FailedJobSchema: Schema<IFailedJob> = new Schema(
  {
    jobType: {
      type: String,
      enum: Object.values(JobType),
      required: [true, 'Job type is required'],
    },
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: [true, 'Article ID is required'],
    },
    errorMessage: {
      type: String,
      required: [true, 'Error message is required'],
    },
    errorStack: {
      type: String,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FailedJobSchema.index({ articleId: 1 });
FailedJobSchema.index({ jobType: 1 });
FailedJobSchema.index({ resolved: 1 });
FailedJobSchema.index({ lastAttemptAt: -1 });

export default mongoose.model<IFailedJob>(
  'FailedJob',
  FailedJobSchema,
  'FailedJobs'
);
