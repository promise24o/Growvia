import { AuditLogModel } from "../models/AuditLog";

interface AuditLogEntry {
    userId: string;
    action: string;
    details: string;
    timestamp?: Date;
}

export const auditLog = async (userId: string, action: string, details: string): Promise<void> => {
    try {
        await AuditLogModel.create({
            userId,
            action,
            details,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        throw new Error('Audit log creation failed');
    }
};