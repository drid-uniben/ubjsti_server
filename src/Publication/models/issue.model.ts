import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIssue extends Document {
  volume: Types.ObjectId;
  issueNumber: number;
  publishDate: Date;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema: Schema<IIssue> = new Schema(
  {
    volume: {
      type: Schema.Types.ObjectId,
      ref: 'Volume',
      required: [true, 'Volume reference is required'],
    },
    issueNumber: {
      type: Number,
      required: [true, 'Issue number is required'],
      min: [1, 'Issue number must be at least 1'],
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: One issue per volume
IssueSchema.index({ volume: 1, issueNumber: 1 }, { unique: true });
IssueSchema.index({ publishDate: -1 });
IssueSchema.index({ isActive: 1 });

export default mongoose.model<IIssue>('Issue', IssueSchema, 'Issues');
