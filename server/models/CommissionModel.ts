// server/models/Commission.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ICommission extends Document {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  type: string;
  conversionEvent?: string;
  payout: {
    amount: number;
    isPercentage: boolean;
    currency?: string;
    baseField?: string;
  };
  maxPerMarketer?: number | null;
  maxTotalPayout?: number | null;
  validationMethod: string;
  webhookUrl?: string;
  secretToken?: string;
  payoutDelay: number;
  oneConversionPerUser: boolean;
  minSessionDuration?: number | null;
  organizationId?: mongoose.Types.ObjectId | null;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  fraudDetection: {
    conversionDelay?: number | null;
    ipRestriction?: string | null;
    deviceFingerprintChecks?: boolean;
    duplicateEmailPhoneBlock?: boolean;
    geoTargeting?: string[] | null;
    minimumOrderValue?: number | null;
    conversionSpikeAlert?: boolean;
    cookieTamperDetection?: boolean;
    affiliateBlacklist?: boolean;
    kycVerifiedOnly?: boolean;
  };
}

const allowedCommissionTypes = ['click', 'visit', 'signup', 'purchase', 'custom'];
const allowedValidationMethods = ['auto', 'webhook', 'manual'];
const allowedStatuses = ['active', 'archived'];

const CommissionSchema = new Schema<ICommission>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => typeof value === 'string' && value.length > 0,
        message: 'Name must be a non-empty string',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: allowedCommissionTypes,
        message: 'Invalid commission type',
      },
    },
    conversionEvent: {
      type: String,
      trim: true,
      required: function () {
        return this.type === 'custom';
      },
    },
    payout: {
      amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive'],
      },
      isPercentage: {
        type: Boolean,
        default: false,
      },
      currency: {
        type: String,
        trim: true,
        required: function () {
          return !this.payout.isPercentage;
        },
      },
      baseField: {
        type: String,
        trim: true,
        required: function () {
          return this.payout.isPercentage;
        },
      },
    },
    maxPerMarketer: {
      type: Number,
      min: [0, 'Must be positive'],
      default: null,
    },
    maxTotalPayout: {
      type: Number,
      min: [0, 'Must be positive'],
      default: null,
    },
    validationMethod: {
      type: String,
      required: true,
      enum: {
        values: allowedValidationMethods,
        message: 'Invalid validation method',
      },
    },
    webhookUrl: {
      type: String,
      trim: true,
      required: function () {
        return this.validationMethod === 'webhook';
      },
    },
    secretToken: {
      type: String,
      trim: true,
      required: function () {
        return this.validationMethod === 'webhook';
      },
    },
    payoutDelay: {
      type: Number,
      required: true,
      min: [0, 'Must be positive'],
    },
    oneConversionPerUser: {
      type: Boolean,
      default: false,
    },
    minSessionDuration: {
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
    fraudDetection: {
      conversionDelay: {
        type: Number,
        min: [1, 'Must be at least 1 day'],
        max: [30, 'Must not exceed 30 days'],
        default: null,
      },
      ipRestriction: {
        type: String,
        enum: ['one_per_12h', null],
        default: null,
      },
      deviceFingerprintChecks: {
        type: Boolean,
        default: false,
      },
      duplicateEmailPhoneBlock: {
        type: Boolean,
        default: false,
      },
      geoTargeting: {
        type: [String],
        default: null,
      },
      minimumOrderValue: {
        type: Number,
        min: [10000, 'Must be at least 10000'],
        default: null,
      },
      conversionSpikeAlert: {
        type: Boolean,
        default: false,
      },
      cookieTamperDetection: {
        type: Boolean,
        default: false,
      },
      affiliateBlacklist: {
        type: Boolean,
        default: false,
      },
      kycVerifiedOnly: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

CommissionSchema.index({ organizationId: 1, createdAt: -1 });
CommissionSchema.index({ type: 1, createdAt: -1 });
CommissionSchema.index({ status: 1 });

export const Commission = mongoose.model<ICommission>('Commission', CommissionSchema);
export const CommissionTypes = allowedCommissionTypes;
export const ValidationMethods = allowedValidationMethods;
export const CommissionStatuses = allowedStatuses;