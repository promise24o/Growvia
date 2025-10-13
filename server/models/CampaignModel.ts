// server/models/Campaign.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ICampaign extends Document {
  _id: string;
  id?: string;
  name: string;
  category: string;
  applicationId: mongoose.Types.ObjectId;
  description: string;
  affiliateRequirements?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  visibility: 'public' | 'invite-only';
  commissionModels: mongoose.Types.ObjectId[];
  safetyBufferPercent: number;
  maxAffiliates: number;
  expectedConversionsPerAffiliate?: number | null;
  organizationId?: mongoose.Types.ObjectId | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  // Computed fields (calculated separately, not as virtuals)
  currentAffiliates?: number;
  totalConversions?: number;
  totalRevenue?: number;
}

const allowedCategories = [
  'e-commerce',
  'saas',
  'finance',
  'health',
  'education',
  'gaming',
  'travel',
  'fashion',
  'food',
  'technology',
  'other'
];

const allowedVisibility = ['public', 'invite-only'];
const allowedStatuses = ['active', 'paused', 'completed', 'archived'];

const CampaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      validate: {
        validator: (value: string) => typeof value === 'string' && value.length >= 3,
        message: 'Name must be at least 3 characters',
      },
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: allowedCategories,
        message: 'Invalid category',
      },
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'App',
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    affiliateRequirements: {
      type: String,
      trim: true,
      minlength: [10, 'Affiliate requirements must be at least 10 characters'],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value: Date | null) {
          if (!value || !this.startDate) return true;
          return value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    visibility: {
      type: String,
      required: true,
      enum: {
        values: allowedVisibility,
        message: 'Invalid visibility option',
      },
      default: 'public',
    },
    commissionModels: {
      type: [Schema.Types.ObjectId],
      ref: 'Commission',
      required: true,
      validate: {
        validator: (value: mongoose.Types.ObjectId[]) => value && value.length > 0,
        message: 'At least one commission model is required',
      },
    },
    safetyBufferPercent: {
      type: Number,
      required: true,
      min: [10, 'Safety buffer must be at least 10%'],
      max: [100, 'Safety buffer cannot exceed 100%'],
    },
    maxAffiliates: {
      type: Number,
      required: true,
      min: [1, 'Must allow at least 1 affiliate'],
      max: [10000, 'Cannot exceed 10,000 affiliates'],
    },
    expectedConversionsPerAffiliate: {
      type: Number,
      min: [0, 'Must be positive'],
      default: null,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: allowedStatuses,
        message: 'Invalid status',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
CampaignSchema.index({ organizationId: 1, createdAt: -1 });
CampaignSchema.index({ category: 1, status: 1 });
CampaignSchema.index({ visibility: 1, status: 1 });
CampaignSchema.index({ startDate: 1, endDate: 1 });
CampaignSchema.index({ applicationId: 1 });

// Virtual fields that calculate actual values from related collections
CampaignSchema.virtual('currentAffiliates').get(function() {
  // This will be populated by the service layer when needed
  return this._currentAffiliates || 0;
});

CampaignSchema.virtual('totalConversions').get(function() {
  // This will be populated by the service layer when needed
  return this._totalConversions || 0;
});

CampaignSchema.virtual('totalRevenue').get(function() {
  // This will be populated by the service layer when needed
  return this._totalRevenue || 0;
});

// Ensure virtual fields are serialized
CampaignSchema.set('toJSON', { virtuals: true });
CampaignSchema.set('toObject', { virtuals: true });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
export const CampaignCategories = allowedCategories;
export const CampaignVisibility = allowedVisibility;
export const CampaignStatuses = allowedStatuses;
