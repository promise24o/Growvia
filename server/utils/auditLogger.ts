import { Request } from 'express';
import { auditLogService } from '../services/auditLog.service';

export interface AuditLogContext {
  action: string;
  description: string;
  type: 'create' | 'update' | 'delete' | 'authentication' | 'security' | 'integration' | 'other';
  entityType: string;
  entityId: string;
  additionalDetails?: any;
}

export class AuditLogger {
  /**
   * Log an audit event from a request context
   */
  static async logFromRequest(req: Request, context: AuditLogContext): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const organizationId = Array.isArray((req as any).user?.organizationId)
        ? (req as any).user.organizationId[0]
        : (req as any).user?.organizationId;

      if (!userId || !organizationId) {
        console.warn('Cannot log audit event: missing user or organization ID');
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
      const userAgent = req.headers['user-agent'];

      await auditLogService.createAuditLog({
        action: context.action,
        description: context.description,
        type: context.type,
        performedBy: userId,
        organizationId,
        entityType: context.entityType,
        entityId: context.entityId,
        ipAddress,
        userAgent,
        details: context.additionalDetails,
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log application-specific events
   */
  static async logApplicationEvent(
    req: Request,
    action: string,
    description: string,
    type: 'create' | 'update' | 'delete' | 'other',
    applicationId: string,
    additionalDetails?: any
  ): Promise<void> {
    await this.logFromRequest(req, {
      action,
      description,
      type,
      entityType: 'Application',
      entityId: applicationId,
      additionalDetails: {
        applicationId,
        ...additionalDetails,
      },
    });
  }

  /**
   * Log promotional material events
   */
  static async logPromoMaterialEvent(
    req: Request,
    action: string,
    description: string,
    type: 'create' | 'update' | 'delete',
    applicationId: string,
    materialId: string,
    additionalDetails?: any
  ): Promise<void> {
    await this.logFromRequest(req, {
      action,
      description,
      type,
      entityType: 'PromoMaterial',
      entityId: materialId,
      additionalDetails: {
        applicationId,
        materialId,
        ...additionalDetails,
      },
    });
  }

  /**
   * Log landing page events
   */
  static async logLandingPageEvent(
    req: Request,
    action: string,
    description: string,
    type: 'create' | 'update' | 'delete',
    applicationId: string,
    pageId: string,
    additionalDetails?: any
  ): Promise<void> {
    await this.logFromRequest(req, {
      action,
      description,
      type,
      entityType: 'LandingPage',
      entityId: pageId,
      additionalDetails: {
        applicationId,
        pageId,
        ...additionalDetails,
      },
    });
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    req: Request,
    action: string,
    description: string,
    userId: string,
    organizationId: string,
    additionalDetails?: any
  ): Promise<void> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
      const userAgent = req.headers['user-agent'];

      await auditLogService.createAuditLog({
        action,
        description,
        type: 'authentication',
        performedBy: userId,
        organizationId,
        entityType: 'User',
        entityId: userId,
        ipAddress,
        userAgent,
        details: additionalDetails,
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    req: Request,
    action: string,
    description: string,
    userId: string,
    organizationId: string,
    additionalDetails?: any
  ): Promise<void> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
      const userAgent = req.headers['user-agent'];

      await auditLogService.createAuditLog({
        action,
        description,
        type: 'security',
        performedBy: userId,
        organizationId,
        entityType: 'Security',
        entityId: userId,
        ipAddress,
        userAgent,
        details: additionalDetails,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

export default AuditLogger;
