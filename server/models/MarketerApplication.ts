import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketerApplication extends Document {
  name: string;
  email: string;
  phone: string;
  organizationId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  applicationDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'invited';
  applicationToken: string;
  tokenExpiry: Date;
  resumeUrl?: string;
  kycDocUrl?: string;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
  experience?: string;
  skills?: string[];
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  user?: mongoose.Types.ObjectId; // Link to the user account if approved
  updatedAt: Date;
}

const MarketerApplicationSchema = new Schema<IMarketerApplication>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'invited'],
    default: 'invited'
  },
  applicationToken: {
    type: String,
    default: () => crypto.randomBytes(32).toString('hex'),
    index: true
  },
  tokenExpiry: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7); // Token expires in 7 days
      return date;
    }
  },
  resumeUrl: {
    type: String
  },
  kycDocUrl: {
    type: String
  },
  socialMedia: {
    twitter: String,
    instagram: String,
    linkedin: String,
    facebook: String
  },
  experience: {
    type: String
  },
  skills: [{
    type: String
  }],
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'applicationDate', updatedAt: 'updatedAt' }
});

// Middleware to check token expiry before operations
MarketerApplicationSchema.pre('findOne', function() {
  // If finding by token, check if token is expired
  if (this.getQuery().applicationToken) {
    this.where({ tokenExpiry: { $gt: new Date() } });
  }
});

// Create and export the model
const MarketerApplication = mongoose.model<IMarketerApplication>('MarketerApplication', MarketerApplicationSchema);
export default MarketerApplication;