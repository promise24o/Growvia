/**
 * Tracking Event Model - MongoDB Schema
 * Stores all tracking events (clicks, visits, signups, purchases, custom)
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITrackingEvent extends Document {
  _id: Types.ObjectId;
  eventId: string;
  type: 'click' | 'visit' | 'signup' | 'purchase' | 'custom';
  timestamp: Date;
  
  // Identifiers
  organizationId: Types.ObjectId;
  campaignId: Types.ObjectId;
  affiliateId: Types.ObjectId; // References CampaignAffiliate
  
  // Session & Attribution
  sessionId: string;
  clickId?: string;
  visitorId: string;
  
  // User Data
  userId?: string;
  email?: string;
  phone?: string;
  
  // Event-specific Data
  metadata?: Record<string, any>;
  
  // Purchase-specific
  orderId?: string;
  amount?: number;
  currency?: string;
  
  // Custom event
  customEventName?: string;
  
  // Context
  context: {
    url: string;
    referrer?: string;
    title?: string;
    
    // UTM params
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    
    // Device & Browser
    userAgent: string;
    ip: string;
    language?: string;
    screenResolution?: string;
    
    // Fingerprint
    deviceFingerprint?: string;
    
    // Geo
    country?: string;
    region?: string;
    city?: string;
    
    // Technical
    timezone?: string;
  };
  
  // Attribution
  attribution?: {
    model: string;
    attributedAffiliateId: Types.ObjectId;
    attributionWeight: number;
    conversionWindow: number;
  };
  
  // Status & Validation
  status: 'pending' | 'validated' | 'rejected' | 'fraud';
  rejectionReason?: string;
  fraudFlags?: string[];
  
  // Payout
  payout?: number;
  payoutCurrency?: string;
  payoutStatus?: 'pending' | 'approved' | 'paid';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['click', 'visit', 'signup', 'purchase', 'custom'],
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    
    // Identifiers
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'CampaignAffiliate',
      required: true,
      index: true,
    },
    
    // Session & Attribution
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    clickId: {
      type: String,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    
    // User Data
    userId: {
      type: String,
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    phone: {
      type: String,
      index: true,
    },
    
    // Event-specific Data
    metadata: {
      type: Schema.Types.Mixed,
    },
    
    // Purchase-specific
    orderId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      length: 3,
    },
    
    // Custom event
    customEventName: {
      type: String,
      index: true,
    },
    
    // Context
    context: {
      url: { type: String, required: true },
      referrer: String,
      title: String,
      
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,
      utmTerm: String,
      utmContent: String,
      
      userAgent: { type: String, required: true },
      ip: { type: String, required: true },
      language: String,
      screenResolution: String,
      
      deviceFingerprint: String,
      
      country: String,
      region: String,
      city: String,
      
      timezone: String,
    },
    
    // Attribution
    attribution: {
      model: String,
      attributedAffiliateId: {
        type: Schema.Types.ObjectId,
        ref: 'CampaignAffiliate',
      },
      attributionWeight: Number,
      conversionWindow: Number,
    },
    
    // Status & Validation
    status: {
      type: String,
      required: true,
      enum: ['pending', 'validated', 'rejected', 'fraud'],
      default: 'pending',
      index: true,
    },
    rejectionReason: String,
    fraudFlags: [String],
    
    // Payout
    payout: {
      type: Number,
      min: 0,
    },
    payoutCurrency: String,
    payoutStatus: {
      type: String,
      enum: ['pending', 'approved', 'paid'],
      index: true,
    },
    
    validatedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
TrackingEventSchema.index({ organizationId: 1, campaignId: 1, createdAt: -1 });
TrackingEventSchema.index({ affiliateId: 1, type: 1, createdAt: -1 });
TrackingEventSchema.index({ sessionId: 1, timestamp: 1 });
TrackingEventSchema.index({ clickId: 1, type: 1 });
TrackingEventSchema.index({ status: 1, createdAt: -1 });
TrackingEventSchema.index({ 'context.ip': 1, createdAt: -1 });
TrackingEventSchema.index({ email: 1, type: 1 });
TrackingEventSchema.index({ phone: 1, type: 1 });

// TTL index for old events (optional - keep for 90 days)
TrackingEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const TrackingEvent = mongoose.model<ITrackingEvent>('TrackingEvent', TrackingEventSchema);
