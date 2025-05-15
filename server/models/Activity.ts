import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  type: string;
  description: string;
  organizationId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'conversion', 
        'payout', 
        'marketer_join', 
        'app_created', 
        'plan_changed',
        'affiliate_link_created',
        'settings_updated'
      ],
    },
    description: {
      type: String,
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track createdAt
  }
);

// Add indexes
ActivitySchema.index({ organizationId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);