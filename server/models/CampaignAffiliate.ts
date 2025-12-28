import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICampaignAffiliate extends Document {
  campaignId: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'removed';
  assignedBy: Types.ObjectId;
  assignedAt: Date;
  removedBy?: Types.ObjectId | undefined;
  removedAt?: Date | undefined;
  removalReason?: string | undefined;
  kycVerified: boolean;
  participationNotes?: string | undefined;
  source?: string;
  // Performance tracking
  clicks: number;
  conversions: number;
  totalRevenue: number;
  totalCommission: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignAffiliateSchema = new Schema<ICampaignAffiliate>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
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
      enum: ['pending', 'active', 'inactive', 'suspended', 'removed'],
      default: 'pending',
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    removedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    removedAt: {
      type: Date,
    },
    removalReason: {
      type: String,
      trim: true,
    },
    kycVerified: {
      type: Boolean,
      default: false,
    },
    participationNotes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['marketplace', 'direct', 'invite', 'other'],
      default: 'direct',
    },
    // Performance metrics
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
CampaignAffiliateSchema.index({ campaignId: 1, userId: 1 }, { unique: true });
CampaignAffiliateSchema.index({ campaignId: 1, status: 1 });
CampaignAffiliateSchema.index({ userId: 1, status: 1 });
CampaignAffiliateSchema.index({ organizationId: 1 });
CampaignAffiliateSchema.index({ assignedAt: -1 });

export const CampaignAffiliate = mongoose.model<ICampaignAffiliate>(
  'CampaignAffiliate',
  CampaignAffiliateSchema
);
