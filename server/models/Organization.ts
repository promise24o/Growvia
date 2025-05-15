import mongoose, { Document, Schema } from 'mongoose';
import { SubscriptionPlan } from '@shared/schema';

export interface IOrganization extends Document {
  name: string;
  email: string;
  logo: string | null;
  plan: string;
  trialEndsAt: Date | null;
  webhookUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    logo: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      default: SubscriptionPlan.FREE_TRIAL,
    },
    trialEndsAt: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setDate(date.getDate() + 7); // 7-day trial period
        return date;
      },
    },
    webhookUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
OrganizationSchema.index({ email: 1 }, { unique: true });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);