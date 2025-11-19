import { Schema, model, Document, Types } from 'mongoose';

export interface IPayoutMethod extends Document {
  userId: Types.ObjectId;
  type: 'bank_account';
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
    swiftCode?: string;
  };
  isDefault: boolean;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payoutMethodSchema = new Schema<IPayoutMethod>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['bank_account'], default: 'bank_account' },
    bankDetails: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      bankCode: { type: String },
      swiftCode: { type: String },
    },
    isDefault: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    verificationDate: { type: Date },
  },
  { timestamps: true }
);

payoutMethodSchema.index({ userId: 1 });
payoutMethodSchema.index({ userId: 1, isDefault: 1 });

export const PayoutMethod = model<IPayoutMethod>('PayoutMethod', payoutMethodSchema);
