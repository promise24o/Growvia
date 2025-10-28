/**
 * Click Tracking Model - MongoDB Schema
 * Stores click data for attribution matching
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClickTracking extends Document {
  _id: Types.ObjectId;
  clickId: string;
  timestamp: Date;
  
  // Identifiers
  affiliateId: Types.ObjectId;
  campaignId: Types.ObjectId;
  organizationId: Types.ObjectId;
  
  // Session
  sessionId: string;
  visitorId: string;
  
  // Context
  context: {
    url: string;
    referrer?: string;
    userAgent: string;
    ip: string;
    deviceFingerprint?: string;
    country?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  
  // Attribution window
  expiresAt: Date;
  
  // Conversion tracking
  converted: boolean;
  conversionId?: string;
  conversionType?: string;
  conversionTimestamp?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ClickTrackingSchema = new Schema<IClickTracking>(
  {
    clickId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    
    // Identifiers
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'CampaignAffiliate',
      required: true,
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    
    // Session
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Context
    context: {
      url: { type: String, required: true },
      referrer: String,
      userAgent: { type: String, required: true },
      ip: { type: String, required: true },
      deviceFingerprint: String,
      country: String,
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,
    },
    
    // Attribution window
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    
    // Conversion tracking
    converted: {
      type: Boolean,
      default: false,
      index: true,
    },
    conversionId: {
      type: String,
      index: true,
    },
    conversionType: String,
    conversionTimestamp: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ClickTrackingSchema.index({ visitorId: 1, campaignId: 1, timestamp: -1 });
ClickTrackingSchema.index({ sessionId: 1, timestamp: -1 });
ClickTrackingSchema.index({ converted: 1, expiresAt: 1 });

// TTL index - auto-delete expired clicks
ClickTrackingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ClickTracking = mongoose.model<IClickTracking>('ClickTracking', ClickTrackingSchema);
