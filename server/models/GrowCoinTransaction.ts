import { Schema, model, Document, Types } from 'mongoose';

interface IGrowCoinTransaction extends Document {
  userId: Types.ObjectId;
  description: string;
  type: 'Earned' | 'Spent' | 'user_transfer' | 'Referral' | 'Wallet Transfer';
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  transactionId: string;
  receiverId?: Types.ObjectId;
  ipAddress?: string;
  deviceFingerprint?: string;
  metadata?: any;
  createdAt: Date;
}

const GrowCoinTransactionSchema = new Schema<IGrowCoinTransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['Earned', 'Spent', 'user_transfer', 'Referral', 'Wallet Transfer'],
    required: true,
  },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Completed' },
  transactionId: { type: String, unique: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  ipAddress: { type: String },
  deviceFingerprint: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const GrowCoinTransaction = model<IGrowCoinTransaction>('GrowCoinTransaction', GrowCoinTransactionSchema);