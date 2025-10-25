import { Types } from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface CreateAuditLogData {
  action: string;
  description: string;
  type: 'create' | 'update' | 'delete' | 'authentication' | 'security' | 'integration' | 'other';
  performedBy: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

export interface AuditLogFilters {
  search?: string;
  type?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  performedBy?: string;
}

export interface AuditLogStats {
  totalEvents: number;
  activeUsers24h: number;
  eventTypes: number;
  recentActivity: any[];
}

export class AuditLogService {
  /**
   * Create a new audit log entry
   */
  async createAuditLog(data: CreateAuditLogData): Promise<IAuditLog> {
    if (!Types.ObjectId.isValid(data.performedBy)) {
      throw new BadRequestError('Invalid user ID');
    }

    if (!Types.ObjectId.isValid(data.organizationId)) {
      throw new BadRequestError('Invalid organization ID');
    }

    const auditLog = new AuditLog({
      action: data.action,
      description: data.description,
      type: data.type,
      performedBy: new Types.ObjectId(data.performedBy),
      organizationId: new Types.ObjectId(data.organizationId),
      entityType: data.entityType,
      entityId: data.entityId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details,
    });

    return await auditLog.save();
  }

  /**
   * Get audit logs for an organization with filters and pagination
   */
  async getAuditLogs(
    organizationId: string,
    filters: AuditLogFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestError('Invalid organization ID');
    }

    const query: any = { organizationId: new Types.ObjectId(organizationId) };

    // Apply filters
    if (filters.search) {
      query.$or = [
        { action: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.entityType) {
      query.entityType = filters.entityType;
    }

    if (filters.performedBy && Types.ObjectId.isValid(filters.performedBy)) {
      query.performedBy = new Types.ObjectId(filters.performedBy);
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    // Format logs for frontend
    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      action: log.action,
      description: log.description,
      type: log.type,
      user: (log.performedBy as any)?.name || 'Unknown User',
      ip: log.ipAddress || 'N/A',
      timestamp: log.timestamp,
      details: log.details,
    }));

    return {
      logs: formattedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit logs for a specific application
   */
  async getApplicationAuditLogs(
    organizationId: string,
    applicationId: string,
    filters: AuditLogFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestError('Invalid organization ID');
    }

    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError('Invalid application ID');
    }

    const enhancedFilters = {
      ...filters,
      entityType: 'Application',
    };

    const result = await this.getAuditLogs(organizationId, enhancedFilters, page, limit);

    // Filter by application ID
    const filteredLogs = result.logs.filter(log => 
      log.details?.applicationId === applicationId || 
      log.details?.entityId === applicationId
    );

    return {
      ...result,
      logs: filteredLogs,
      total: filteredLogs.length,
    };
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(organizationId: string): Promise<AuditLogStats> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestError('Invalid organization ID');
    }

    const orgId = new Types.ObjectId(organizationId);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalEvents, activeUsers24h, eventTypes, recentActivity] = await Promise.all([
      // Total events
      AuditLog.countDocuments({ organizationId: orgId }),

      // Active users in last 24h
      AuditLog.distinct('performedBy', {
        organizationId: orgId,
        timestamp: { $gte: yesterday },
      }).then(users => users.length),

      // Number of different event types
      AuditLog.distinct('type', { organizationId: orgId }).then(types => types.length),

      // Recent activity (last 5 events)
      AuditLog.find({ organizationId: orgId })
        .populate('performedBy', 'name')
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),
    ]);

    const formattedRecentActivity = recentActivity.map(log => ({
      id: log._id.toString(),
      action: log.action,
      user: (log.performedBy as any)?.name || 'Unknown User',
      timestamp: log.timestamp,
    }));

    return {
      totalEvents,
      activeUsers24h,
      eventTypes,
      recentActivity: formattedRecentActivity,
    };
  }

  /**
   * Export audit logs (for download functionality)
   */
  async exportAuditLogs(
    organizationId: string,
    filters: AuditLogFilters = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestError('Invalid organization ID');
    }

    // Get all logs without pagination for export
    const result = await this.getAuditLogs(organizationId, filters, 1, 10000);

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = ['ID', 'Action', 'Description', 'Type', 'User', 'IP Address', 'Timestamp'];
      const csvRows = result.logs.map(log => [
        log.id,
        log.action,
        log.description,
        log.type,
        log.user,
        log.ip,
        log.timestamp.toISOString(),
      ]);

      return {
        headers: csvHeaders,
        rows: csvRows,
      };
    }

    return result.logs;
  }

  /**
   * Helper method to log application-related actions
   */
  async logApplicationAction(
    action: string,
    description: string,
    type: 'create' | 'update' | 'delete' | 'other',
    applicationId: string,
    userId: string,
    organizationId: string,
    ipAddress?: string,
    userAgent?: string,
    additionalDetails?: any
  ): Promise<IAuditLog> {
    return this.createAuditLog({
      action,
      description,
      type,
      performedBy: userId,
      organizationId,
      entityType: 'Application',
      entityId: applicationId,
      ipAddress,
      userAgent,
      details: {
        applicationId,
        ...additionalDetails,
      },
    });
  }
}

export const auditLogService = new AuditLogService();
