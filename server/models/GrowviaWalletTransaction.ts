import { Schema, model, Document, Types } from 'mongoose';

export enum TransactionType {
  DEPOSIT = 'deposit', // GrowCoin to Growvia Wallet
  WITHDRAWAL = 'withdrawal', // Growvia Wallet to Bank
  AFFILIATE_PAYMENT = 'affiliate_payment', // Payment from affiliate sales
  REFUND = 'refund', // Refund to wallet
  FEE = 'fee', // Processing fee deduction
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface IGrowviaWalletTransaction extends Document {
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  type: TransactionType;
  status: TransactionStatus;
  amount: number; // Transaction amount in Naira
  fee: number; // Processing fee
  netAmount: number; // Amount after fee
  balanceBefore: number;
  balanceAfter: number;
  reference: string; // Unique transaction reference
  description: string;
  metadata?: {
    growCoinAmount?: number; // Original GrowCoin amount for deposits
    conversionRate?: number; // GrowCoin to Naira rate
    bankDetails?: {
      accountNumber: string;
      accountName: string;
      bankName: string;
      bankCode?: string;
    };
    payoutRequestId?: Types.ObjectId;
    campaignId?: Types.ObjectId;
    affiliateId?: Types.ObjectId;
    failureReason?: string;
  };
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const growviaWalletTransactionSchema = new Schema<IGrowviaWalletTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'GrowviaWallet', required: true },
    type: { 
      type: String, 
      enum: Object.values(TransactionType), 
      required: true 
    },
    status: { 
      type: String, 
      enum: Object.values(TransactionStatus), 
      default: TransactionStatus.PENDING 
    },
    amount: { type: Number, required: true, min: 0 },
    fee: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reference: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for faster queries
growviaWalletTransactionSchema.index({ userId: 1, createdAt: -1 });
growviaWalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
growviaWalletTransactionSchema.index({ reference: 1 });
growviaWalletTransactionSchema.index({ status: 1 });
growviaWalletTransactionSchema.index({ type: 1 });

export const GrowviaWalletTransaction = model<IGrowviaWalletTransaction>(
  'GrowviaWalletTransaction',
  growviaWalletTransactionSchema
);
