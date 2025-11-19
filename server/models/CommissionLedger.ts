import { Schema, model, Document, Types } from 'mongoose';

export interface ICommissionLedger extends Document {
  userId: Types.ObjectId;
  campaignId: Types.ObjectId;
  organizationId: Types.ObjectId;
  commissionModelId: Types.ObjectId;
  type: 'CPS' | 'CPA' | 'CPL' | 'CPC' | 'Hybrid';
  amount: number;
  conversionValue: number;
  conversionId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  payoutRequestId?: Types.ObjectId;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const commissionLedgerSchema = new Schema<ICommissionLedger>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    commissionModelId: { type: Schema.Types.ObjectId, ref: 'CommissionModel', required: true },
    type: {
      type: String,
      enum: ['CPS', 'CPA', 'CPL', 'CPC', 'Hybrid'],
      required: true,
    },
    amount: { type: Number, required: true },
    conversionValue: { type: Number, required: true },
    conversionId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    paidAt: { type: Date },
    payoutRequestId: { type: Schema.Types.ObjectId, ref: 'PayoutRequest' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

commissionLedgerSchema.index({ userId: 1, status: 1 });
commissionLedgerSchema.index({ campaignId: 1 });
commissionLedgerSchema.index({ status: 1, approvalStatus: 1 });
commissionLedgerSchema.index({ createdAt: -1 });

export const CommissionLedger = model<ICommissionLedger>('CommissionLedger', commissionLedgerSchema);
