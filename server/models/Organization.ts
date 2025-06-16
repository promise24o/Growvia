import { insertOrganizationSchema, SubscriptionPlan } from '@shared/schema';
import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Infer the TypeScript type from the Zod schema
type InsertOrganizationType = z.infer<typeof insertOrganizationSchema>;

export interface IOrganization extends Document, InsertOrganizationType { 
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
        date.setDate(date.getDate() + 7); 
        return date;
      },
    },
    webhookUrl: {
      type: String,
      default: null,
    },
     onboardingCompleted: {  
      type: Boolean,
      default: false,
    },
    position: {
      type: String,
      default: null,
    },
    industry: {
      type: String,
      default: null,
    },
    companySize: {
      type: String,
      default: null,
    },
        primaryGoal: {
      type: String,
      default: null,
    },
    targetAudience: {
      type: String,
      default: null,
    },
    existingAffiliates: {
      type: String,
      default: null,
    },
    productsToPromote: {
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