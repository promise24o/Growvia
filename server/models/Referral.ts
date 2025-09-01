import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReferral extends Document {
  referrerId: Types.ObjectId;
  referredId: Types.ObjectId;
  type: 'marketer' | 'organization';
  status: 'pending' | 'earned' | 'rejected';
  rewardAmount?: number;
  rewardType?: 'growcoins' | 'discount' | 'bonus_tokens';
  organizationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema: Schema = new Schema(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referredId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['marketer', 'organization'], required: true },
    status: { type: String, enum: ['pending', 'earned', 'rejected'], default: 'pending' },
    rewardAmount: { type: Number },
    rewardType: { type: String, enum: ['growcoins', 'discount', 'bonus_tokens'] },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  },
  { timestamps: true }
);

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);