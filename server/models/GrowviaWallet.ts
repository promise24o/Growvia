import { Schema, model, Document, Types } from 'mongoose';

export interface IGrowviaWallet extends Document {
  userId: Types.ObjectId;
  balance: number; // Available balance in Naira
  pendingBalance: number; // Pending balance (not yet cleared)
  totalDeposited: number; // Total amount deposited from GrowCoins
  totalWithdrawn: number; // Total amount withdrawn to bank
  createdAt: Date;
  updatedAt: Date;
}

const growviaWalletSchema = new Schema<IGrowviaWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalDeposited: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Index for faster queries
growviaWalletSchema.index({ userId: 1 });

export const GrowviaWallet = model<IGrowviaWallet>('GrowviaWallet', growviaWalletSchema);
