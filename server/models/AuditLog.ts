import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  description: string;
  type: 'create' | 'update' | 'delete' | 'authentication' | 'security' | 'integration' | 'other';
  performedBy: Types.ObjectId;
  organizationId: Types.ObjectId;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['create', 'update', 'delete', 'authentication', 'security', 'integration', 'other'],
    default: 'other'
  },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ organizationId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);