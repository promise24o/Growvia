import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  type: string;
  description: string;
  organizationId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

const allowedTypes = [
  "conversion",
  "payout",
  "marketer_join",
  "app_created",
  "plan_changed",
  "marketer_rejected",
  "affiliate_link_created",
  "settings_updated",
  "organization_created",
  "user_created",
  "marketer_invited",
  "verification_email_resent",
  "email_verified",
  "fraud_review_requested",
  "marketer_revoked",
  "application_removed",
  "marketer_registered",
  "campaign_invitation_received",
  "campaign_invitation_accepted",
  "campaign_invitation_declined",
  "campaign_invitation_resent",
];

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => typeof value === "string",
        message: "Type must be a string",
      },
    },
    description: {
      type: String,
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivitySchema.index({ organizationId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
export const ActivityTypes = allowedTypes;
