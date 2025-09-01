import mongoose, { Document, Schema } from "mongoose";

export interface ICommission extends Document {
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
  createdAt: Date;
  updatedAt: Date;
  isPercentage: boolean;
}

const allowedCommissionTypes = ['click', 'visit', 'signup', 'purchase', 'custom'];
const allowedValidationMethods = ['auto', 'webhook', 'manual'];

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
          return !this.isPercentage;
        },
      },
      baseField: {
        type: String,
        trim: true,
        required: function () {
          return this.isPercentage;
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
  },
  {
    timestamps: true,
  }
);

CommissionSchema.index({ organizationId: 1, createdAt: -1 });
CommissionSchema.index({ type: 1, createdAt: -1 });

export const Commission = mongoose.model<ICommission>('Commission', CommissionSchema);
export const CommissionTypes = allowedCommissionTypes;
export const ValidationMethods = allowedValidationMethods;