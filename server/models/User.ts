import bcrypt from "bcrypt";
import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "../../shared/schema";

export interface IUser extends Document {
  name: string;
  username?: string;
  about?: string;
  country?: string;
  state?: string;
  languages?: string[];
  industryFocus?: string;
  email: string;
  password: string;
  phone: string | null;
  role: string;
  organizationId: mongoose.Types.ObjectId[];
  avatar: string | null;
  status: "active" | "inactive" | "pending" | "unverified";
  verificationToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  clicks: number;
  conversions: number;
  commission: number;
  payoutStatus: "pending" | "approved" | "rejected";
  assignedApps: mongoose.Types.ObjectId[];
  socialMedia: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
  skills: string[];
  loginNotifications: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  backupCodes: string[];
  deletionRequestedAt?: Date;
  deletionScheduledAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true },
    about: { type: String, trim: true },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    languages: [{ type: String, trim: true }],
    industryFocus: { type: String, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },

    phone: { type: String, default: null, trim: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    organizationId: {
      type: [Schema.Types.ObjectId],
      ref: "Organization",
      default: [],
    },
    avatar: { type: String, default: null },

    status: {
      type: String,
      enum: ["active", "inactive", "pending", "unverified"],
      default: "unverified",
    },
    verificationToken: { type: String, default: null },

    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    payoutStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    assignedApps: [
      {
        type: Schema.Types.ObjectId,
        ref: "App",
        default: [],
      },
    ],
    socialMedia: {
      twitter: { type: String, trim: true },
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      facebook: { type: String, trim: true },
    },
    skills: [{ type: String, default: [], trim: true }],
    loginNotifications: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },
    backupCodes: [{ type: String }],
    deletionRequestedAt: { type: Date },
    deletionScheduledAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ organizationId: 1 });
UserSchema.index({ verificationToken: 1 });

UserSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
