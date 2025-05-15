import mongoose, { Document, Schema } from 'mongoose';

export interface IApp extends Document {
  name: string;
  description: string | null;
  icon: string | null;
  organizationId: mongoose.Types.ObjectId;
  baseUrl: string;
  commissionType: string;
  commissionValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppSchema = new Schema<IApp>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    baseUrl: {
      type: String,
      required: true,
      trim: true,
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: {
      type: Number,
      default: 10, // Default 10% or $10 depending on commissionType
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
AppSchema.index({ organizationId: 1 });
AppSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const App = mongoose.model<IApp>('App', AppSchema);