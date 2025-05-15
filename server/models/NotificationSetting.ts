import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationSetting extends Document {
  userId: mongoose.Types.ObjectId;
  emailNotifications: boolean;
  conversionAlerts: boolean;
  payoutAlerts: boolean;
  marketingTips: boolean;
  updatedAt: Date;
}

const NotificationSettingSchema = new Schema<INotificationSetting>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    conversionAlerts: {
      type: Boolean,
      default: true,
    },
    payoutAlerts: {
      type: Boolean,
      default: true,
    },
    marketingTips: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true }, // Only track updatedAt
  }
);

// Add indexes
NotificationSettingSchema.index({ userId: 1 }, { unique: true });

export const NotificationSetting = mongoose.model<INotificationSetting>('NotificationSetting', NotificationSettingSchema);