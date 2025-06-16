import { UserRole } from "@shared/schema";
import crypto from "crypto";
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  organizationId: mongoose.Types.ObjectId[] | null;
  avatar: string | null;
  status: string;
  verificationToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    organizationId: {
      type: [Schema.Types.ObjectId], 
      ref: "Organization",
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "unverified"],
      default: "unverified",
    },
    verificationToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ organizationId: 1 });
UserSchema.index({ verificationToken: 1 });

// Hash password before saving
UserSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }

  try {
    const hash = crypto
      .createHash("sha256")
      .update(user.password)
      .digest("hex");

    user.password = hash;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = function (
  candidatePassword: string
): boolean {
  const hash = crypto
    .createHash("sha256")
    .update(candidatePassword)
    .digest("hex");

  return this.password === hash;
};

export const User = mongoose.model<IUser>("User", UserSchema);
