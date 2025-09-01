import { Schema, model, Document } from 'mongoose';

interface IAuditLog extends Document {
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLogModel = model<IAuditLog>('AuditLog', auditLogSchema);