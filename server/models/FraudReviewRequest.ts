import mongoose, { Document, Schema } from 'mongoose';

export interface IFraudReviewRequest extends Document {
  marketerId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  reason: string;
  reviewed: boolean;
  verdict: 'pending' | 'confirmed_fraud' | 'cleared' | 'reversed';
  adminNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FraudReviewRequestSchema = new Schema<IFraudReviewRequest>(
  {
    marketerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
    verdict: {
      type: String,
      enum: ['pending', 'confirmed_fraud', 'cleared', 'reversed'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to optimize querying
FraudReviewRequestSchema.index({ organizationId: 1 });
FraudReviewRequestSchema.index({ marketerId: 1 });
FraudReviewRequestSchema.index({ verdict: 1 });
FraudReviewRequestSchema.index({ reviewed: 1 });

export const FraudReviewRequest = mongoose.model<IFraudReviewRequest>(
  'FraudReviewRequest',
  FraudReviewRequestSchema
);
