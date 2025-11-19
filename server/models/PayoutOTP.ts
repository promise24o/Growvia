import { Schema, model, Document, Types } from 'mongoose';

export interface IPayoutOTP extends Document {
  userId: Types.ObjectId;
  payoutMethodId: Types.ObjectId;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const payoutOTPSchema = new Schema<IPayoutOTP>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    payoutMethodId: { type: Schema.Types.ObjectId, ref: 'PayoutMethod', required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

payoutOTPSchema.index({ userId: 1, payoutMethodId: 1 });
payoutOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PayoutOTP = model<IPayoutOTP>('PayoutOTP', payoutOTPSchema);
