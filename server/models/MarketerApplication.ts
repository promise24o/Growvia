import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IOrganization } from './Organization';

export interface IMarketerApplication extends Document {
  email: string;
  name: string;
  phone: string;
  applicationToken: string;
  organizationId: mongoose.Types.ObjectId | string;
  resumeUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  kycData: {
    address: string;
    city: string;
    state: string;
    idType: string;
    idNumber: string;
    idDocumentUrl: string | null;
  } | null;
  invitedBy: mongoose.Types.ObjectId | string | null;
  applicationDate: Date;
  reviewedBy: mongoose.Types.ObjectId | string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  user: mongoose.Types.ObjectId | string | null; // Linked user after approval
}

const MarketerApplicationSchema = new Schema<IMarketerApplication>({
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  phone: { 
    type: String, 
    required: false,
    trim: true 
  },
  applicationToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  resumeUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  kycData: {
    address: String,
    city: String,
    state: String,
    idType: String,
    idNumber: String,
    idDocumentUrl: String
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: null
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

export default mongoose.model<IMarketerApplication>('MarketerApplication', MarketerApplicationSchema);