import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IAffiliateLink extends Document {
  code: string;
  userId: mongoose.Types.ObjectId;
  appId: mongoose.Types.ObjectId;
  clicks: number;
  customParameters: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateLinkSchema = new Schema<IAffiliateLink>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appId: {
      type: Schema.Types.ObjectId,
      ref: 'App',
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    customParameters: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
AffiliateLinkSchema.index({ code: 1 }, { unique: true });
AffiliateLinkSchema.index({ userId: 1 });
AffiliateLinkSchema.index({ appId: 1 });

// Generate a unique code for new affiliate links
AffiliateLinkSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    try {
      // Generate a unique code based on userId, appId and timestamp
      const timestamp = Date.now().toString();
      const hashBase = `${this.userId}-${this.appId}-${timestamp}`;
      
      // Create a short hash (8 characters)
      const hash = crypto
        .createHash('md5')
        .update(hashBase)
        .digest('hex')
        .substring(0, 8);
        
      this.code = hash;
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

export const AffiliateLink = mongoose.model<IAffiliateLink>('AffiliateLink', AffiliateLinkSchema);