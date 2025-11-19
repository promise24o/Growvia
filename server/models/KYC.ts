import { Schema, model, Document, Types } from 'mongoose';

export enum KYCTier {
  SPROUT = 'sprout',
  BLOOM = 'bloom',
  THRIVE = 'thrive',
}

export enum KYCStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
}

export enum DocumentType {
  NIN_SLIP = 'nin_slip',
  VOTERS_CARD = 'voters_card',
  DRIVERS_LICENSE = 'drivers_license',
  UTILITY_BILL = 'utility_bill',
}

export interface IKYCDocument {
  type: DocumentType;
  url: string;
  uploadedAt: Date;
  status: KYCStatus;
  rejectionReason?: string;
}

export interface IBVNData {
  bvn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  phoneNumber: string;
  verifiedAt: Date;
  photoUrl?: string;
}

export interface IKYC extends Document {
  userId: Types.ObjectId;
  tier: KYCTier;
  status: KYCStatus;
  
  // Tier 0 - Sprout
  emailVerified: boolean;
  
  // Tier 1 - Bloom
  bvnData?: IBVNData;
  bvnVerifiedAt?: Date;
  
  // Tier 2 - Thrive
  documents: IKYCDocument[];
  selfieUrl?: string;
  selfieVerifiedAt?: Date;
  utilityBillUrl?: string;
  
  // Financial Limits
  dailyPurchaseLimit: number;
  portfolioMaxBalance: number;
  maxWithdrawalAmount: number;
  dailyWithdrawalLimit: number;
  withdrawalsEnabled: boolean;
  
  // Metadata
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  submittedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const kycSchema = new Schema<IKYC>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tier: { 
      type: String, 
      enum: Object.values(KYCTier), 
      default: KYCTier.SPROUT 
    },
    status: { 
      type: String, 
      enum: Object.values(KYCStatus), 
      default: KYCStatus.PENDING 
    },
    
    // Tier 0
    emailVerified: { type: Boolean, default: false },
    
    // Tier 1
    bvnData: {
      bvn: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      middleName: { type: String },
      dateOfBirth: { type: String },
      phoneNumber: { type: String },
      verifiedAt: { type: Date },
      photoUrl: { type: String },
    },
    bvnVerifiedAt: { type: Date },
    
    // Tier 2
    documents: [{
      type: { 
        type: String, 
        enum: Object.values(DocumentType), 
        required: true 
      },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: Object.values(KYCStatus), 
        default: KYCStatus.PENDING 
      },
      rejectionReason: { type: String },
    }],
    selfieUrl: { type: String },
    selfieVerifiedAt: { type: Date },
    utilityBillUrl: { type: String },
    
    // Financial Limits
    dailyPurchaseLimit: { type: Number, default: 5000 },
    portfolioMaxBalance: { type: Number, default: 10000 },
    maxWithdrawalAmount: { type: Number, default: 0 },
    dailyWithdrawalLimit: { type: Number, default: 0 },
    withdrawalsEnabled: { type: Boolean, default: false },
    
    // Metadata
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

kycSchema.index({ userId: 1 });
kycSchema.index({ tier: 1 });
kycSchema.index({ status: 1 });

export const KYC = model<IKYC>('KYC', kycSchema);
