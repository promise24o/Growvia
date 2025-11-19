import { Schema, model, Document, Types } from 'mongoose';

export interface IPayoutRequest extends Document {
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'reversed';
  type: 'withdrawal' | 'manual_payout' | 'bonus_payout';
  payoutMethodId: Types.ObjectId;
  transactionId: string;
  fees: number;
  netAmount: number;
  requestedAt: Date;
  processedAt?: Date;
  paidAt?: Date;
  failureReason?: string;
  processedBy?: Types.ObjectId;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const payoutRequestSchema = new Schema<IPayoutRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'reversed'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['withdrawal', 'manual_payout', 'bonus_payout'],
      default: 'withdrawal',
    },
    payoutMethodId: { type: Schema.Types.ObjectId, ref: 'PayoutMethod', required: true },
    transactionId: { type: String, required: true, unique: true },
    fees: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    paidAt: { type: Date },
    failureReason: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

payoutRequestSchema.index({ userId: 1, status: 1 });
payoutRequestSchema.index({ transactionId: 1 });
payoutRequestSchema.index({ createdAt: -1 });

export const PayoutRequest = model<IPayoutRequest>('PayoutRequest', payoutRequestSchema);
