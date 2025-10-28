/**
 * Session Tracking Model - MongoDB Schema
 * Stores session data for behavioral analysis
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISessionTracking extends Document {
  _id: Types.ObjectId;
  sessionId: string;
  visitorId: string;
  
  // Timing
  startTime: Date;
  lastActivityTime: Date;
  duration: number; // in seconds
  
  // Activity
  pageViews: number;
  events: string[]; // event IDs
  
  // Attribution
  firstClickId?: string;
  lastClickId?: string;
  allClickIds: string[];
  
  // Context
  initialReferrer?: string;
  initialUrl?: string;
  
  // Fingerprint
  deviceFingerprint?: string;
  ip: string;
  userAgent?: string;
  
  // Geo
  country?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const SessionTrackingSchema = new Schema<ISessionTracking>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Timing
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    lastActivityTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    
    // Activity
    pageViews: {
      type: Number,
      default: 0,
    },
    events: {
      type: [String],
      default: [],
    },
    
    // Attribution
    firstClickId: String,
    lastClickId: String,
    allClickIds: {
      type: [String],
      default: [],
    },
    
    // Context
    initialReferrer: String,
    initialUrl: String,
    
    // Fingerprint
    deviceFingerprint: String,
    ip: {
      type: String,
      required: true,
    },
    userAgent: String,
    
    // Geo
    country: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
SessionTrackingSchema.index({ visitorId: 1, startTime: -1 });
SessionTrackingSchema.index({ lastActivityTime: 1 });

// TTL index - auto-delete old sessions (30 days)
SessionTrackingSchema.index({ lastActivityTime: 1 }, { expireAfterSeconds: 2592000 });

export const SessionTracking = mongoose.model<ISessionTracking>('SessionTracking', SessionTrackingSchema);
