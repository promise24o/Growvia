import { AuditLog } from "../models/AuditLog";

interface AuditLogEntry {
    userId: string;
    action: string;
    details: string;
    timestamp?: Date;
}

export const auditLog = async (userId: string, action: string, details: string): Promise<void> => {
    try {
        await AuditLog.create({
            action,
            description: details,
            type: 'other',
            performedBy: userId,
            organizationId: userId,
            entityType: 'WalletTransaction',
            entityId: userId,
            details: { action, description: details },
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};