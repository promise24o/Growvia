import mongoose, { Document, Schema } from 'mongoose';

export interface IConversion extends Document {
  linkId: mongoose.Types.ObjectId;
  transactionId: string;
  amount: number;
  commission: number;
  status: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionSchema = new Schema<IConversion>(
  {
    linkId: {
      type: Schema.Types.ObjectId,
      ref: 'AffiliateLink',
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes (transactionId already has unique index from schema definition)
ConversionSchema.index({ linkId: 1 });
ConversionSchema.index({ status: 1 });

export const Conversion = mongoose.model<IConversion>('Conversion', ConversionSchema);