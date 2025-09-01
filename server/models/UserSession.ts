import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  location?: string;
  token: string;
  revoked: boolean;
  createdAt: Date;
  lastActive: Date;
}

const UserSessionSchema = new Schema<IUserSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ipAddress: String,
  userAgent: String,
  location: String,
  token: String,
  revoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

export const UserSession = mongoose.model<IUserSession>('UserSession', UserSessionSchema);
