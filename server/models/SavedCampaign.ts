import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedCampaign extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savedCampaignSchema = new Schema<ISavedCampaign>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true }
}, { timestamps: true });

savedCampaignSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

export const SavedCampaign = mongoose.model<ISavedCampaign>('SavedCampaign', savedCampaignSchema);
