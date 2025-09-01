import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketerOrganization extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'revoked' | 'under_review';
  appliedAt: Date;
  approvedAt?: Date;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revocationReason?: string;
  reviewRequestId?: mongoose.Types.ObjectId;
}

const MarketerOrganizationSchema = new Schema<IMarketerOrganization>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'revoked', 'under_review'],
      default: 'pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revocationReason: {
      type: String,
    },
    reviewRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'FraudReviewRequest',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness of marketer per organization
MarketerOrganizationSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export const MarketerOrganization = mongoose.model<IMarketerOrganization>(
  'MarketerOrganization',
  MarketerOrganizationSchema
);
