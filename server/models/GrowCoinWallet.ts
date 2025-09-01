import { Schema, model, Document, Types } from 'mongoose';

interface IGrowCoinWallet extends Document {
  userId: Types.ObjectId;
  balance: number;
  pendingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const GrowCoinWalletSchema = new Schema<IGrowCoinWallet>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const GrowCoinWallet = model<IGrowCoinWallet>('GrowCoinWallet', GrowCoinWalletSchema);