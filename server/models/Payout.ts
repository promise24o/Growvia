import mongoose, { Document, Schema } from 'mongoose';

export interface IPayout extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: string;
  paymentMethod: string;
  paymentReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['bank_transfer', 'paypal', 'crypto', 'mobile_money'],
    },
    paymentReference: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
PayoutSchema.index({ userId: 1 });
PayoutSchema.index({ status: 1 });
PayoutSchema.index({ createdAt: -1 });

export const Payout = mongoose.model<IPayout>('Payout', PayoutSchema);