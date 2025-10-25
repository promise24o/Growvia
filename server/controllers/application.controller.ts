import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { appService } from '../services/application.service';
import { fileService } from '../services/file.service';
import { auditLogService } from '../services/auditLog.service';
import AuditLogger from '../utils/auditLogger';

export class AppController {
  async getOrganizationAppStats(req: Request, res: Response) {
    try {
      const organizationId = Array.isArray((req as any).user?.organizationId)
        ? (req as any).user.organizationId[0]
        : (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Organization ID not found',
        });
      }

      const stats = await appService.getAppStats(organizationId);
      return res.status(200).json({
        status: 'success',
        data: stats,
        message: 'App stats retrieved successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve app stats',
      });
    }
  }

  async createApp(req: Request, res: Response) {
    try {
      const data = req.body;
      const userId = (req as any).user?.id;
      const organizationId = Array.isArray((req as any).user?.organizationId)
        ? (req as any).user.organizationId[0]
        : (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Organization ID is required',
        });
      }

      data.organizationId = organizationId;
      const app = await appService.createApp(data, req.file, userId);

      return res.status(201).json({
        status: 'success',
        message: 'App created successfully',
        data: app,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create app',
      });
    }
  }

  async getApp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const app = await appService.getAppById(id);
      return res.status(200).json({
        status: 'success',
        data: app,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch app',
      });
    }
  }

  async getOrganizationApps(req: Request, res: Response) {
    try {
      let organizationId = Array.isArray((req as any).user?.organizationId)
        ? (req as any).user.organizationId[0]
        : (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Organization ID not found',
        });
      }

      if (typeof organizationId !== 'string') {
        organizationId = organizationId.toString();
      }

      if (!/^[a-fA-F0-9]{24}$/.test(organizationId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid organization ID format',
        });
      }

      const apps = await appService.getAppsByOrganization(organizationId);
      return res.status(200).json({
        status: 'success',
        data: apps,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch organization apps',
      });
    }
  }

  async updateApp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = (req as any).user?.id;
      const app = await appService.updateApp(id, data, req.file, userId);
      return res.status(200).json({
        status: 'success',
        message: 'App updated successfully',
        data: app,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to update app',
      });
    }
  }

  async duplicateApp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = Array.isArray((req as any).user?.organizationId)
        ? (req as any).user.organizationId[0]
        : (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Organization ID not found',
        });
      }

      const app = await appService.duplicateApp(id, organizationId);
      return res.status(201).json({
        status: 'success',
        message: 'App duplicated successfully',
        data: app,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to duplicate app',
      });
    }
  }

  async deleteApp(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await appService.deleteApp(id);
      return res.status(200).json({
        status: 'success',
        message: 'App deleted successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to delete app',
      });
    }
  }

  // ===== ASSET MANAGEMENT CONTROLLERS =====

  async getAppAssets(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const assets = await appService.getAppAssets(id, userId);
      return res.status(200).json({
        status: 'success',
        data: assets,
        message: 'App assets retrieved successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve app assets',
      });
    }
  }

  async uploadPromoMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = (req as any).user?.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded',
        });
      }

      const material = await appService.uploadPromoMaterial(id, file, name, userId);
      
      // Log audit event
      await AuditLogger.logPromoMaterialEvent(
        req,
        'Promotional Material Uploaded',
        `Uploaded promotional material: ${material.name}`,
        'create',
        id,
        material.id.toString(),
        { fileName: file.originalname, fileSize: file.size }
      );

      return res.status(201).json({
        status: 'success',
        data: material,
        message: 'Promotional material uploaded successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to upload promotional material',
      });
    }
  }

  async deletePromoMaterial(req: Request, res: Response) {
    try {
      const { id, materialId } = req.params;
      const userId = (req as any).user?.id;

      await appService.deletePromoMaterial(id, materialId, userId);
      
      // Log audit event
      await AuditLogger.logPromoMaterialEvent(
        req,
        'Promotional Material Deleted',
        `Deleted promotional material with ID: ${materialId}`,
        'delete',
        id,
        materialId
      );

      return res.status(200).json({
        status: 'success',
        message: 'Promotional material deleted successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
          materialId: req.params.materialId,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to delete promotional material',
      });
    }
  }

  async addLandingPage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const landingPageData = req.body;
      const userId = (req as any).user?.id;

      const landingPage = await appService.addLandingPage(id, landingPageData, userId);
      
      // Log audit event
      await AuditLogger.logLandingPageEvent(
        req,
        'Landing Page Added',
        `Added landing page: ${landingPage.title}`,
        'create',
        id,
        landingPage.id,
        { url: landingPage.url, isPrimary: landingPage.isPrimary }
      );

      return res.status(201).json({
        status: 'success',
        data: landingPage,
        message: 'Landing page added successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
          landingPageData: req.body,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to add landing page',
      });
    }
  }

  async deleteLandingPage(req: Request, res: Response) {
    try {
      const { id, pageId } = req.params;
      const userId = (req as any).user?.id;

      await appService.deleteLandingPage(id, pageId, userId);
      return res.status(200).json({
        status: 'success',
        message: 'Landing page deleted successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
          pageId: req.params.pageId,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to delete landing page',
      });
    }
  }

  async setPrimaryLandingPage(req: Request, res: Response) {
    try {
      const { id, pageId } = req.params;
      const userId = (req as any).user?.id;

      await appService.setPrimaryLandingPage(id, pageId, userId);
      return res.status(200).json({
        status: 'success',
        message: 'Primary landing page set successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
          pageId: req.params.pageId,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to set primary landing page',
      });
    }
  }

  async updateAppStoreLinks(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const links = req.body;
      const userId = (req as any).user?.id;

      const updatedLinks = await appService.updateAppStoreLinks(id, links, userId);
      return res.status(200).json({
        status: 'success',
        data: updatedLinks,
        message: 'App store links updated successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
          links: req.body,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to update app store links',
      });
    }
  }

  async migrateLegacyLandingPages(req: Request, res: Response) {
    try {
      const result = await appService.migrateLegacyLandingPages();
      return res.status(200).json({
        status: 'success',
        data: result,
        message: `Migration completed. ${result.migrated} out of ${result.total} applications migrated.`,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to migrate landing pages',
      });
    }
  }

  // ===== AUDIT LOG CONTROLLERS =====

  async getApplicationAuditLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { search, type, startDate, endDate, page = 1, limit = 50 } = req.query;
      const organizationId = Array.isArray((req as any).user?.organizationId)
        ? (req as any).user.organizationId[0]
        : (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Organization ID not found',
        });
      }

      const filters: any = {};
      if (search) filters.search = search as string;
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await auditLogService.getApplicationAuditLogs(
        organizationId,
        id,
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json({
        status: 'success',
        data: result,
        message: 'Audit logs retrieved successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve audit logs',
      });
    }
  }

  async getApplicationAuditStats(req: Request, res: Response) {
    try {
      const organizationId = Array.isArray((req as any).user?.organizationId)
        ? (req as any).user.organizationId[0]
        : (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Organization ID not found',
        });
      }

      const stats = await auditLogService.getAuditLogStats(organizationId);
      return res.status(200).json({
        status: 'success',
        data: stats,
        message: 'Audit log statistics retrieved successfully',
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve audit log statistics',
      });
    }
  }

  async exportApplicationAuditLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { search, type, startDate, endDate, format = 'json' } = req.query;
      const organizationId = Array.isArray((req as any).user?.organizationId)
        ? (req as any).user.organizationId[0]
        : (req as any).user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Organization ID not found',
        });
      }

      const filters: any = {};
      if (search) filters.search = search as string;
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const exportData = await auditLogService.exportAuditLogs(
        organizationId,
        filters,
        format as 'json' | 'csv'
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${id}.csv"`);
        
        // Convert to CSV string
        const csvContent = [
          exportData.headers.join(','),
          ...exportData.rows.map((row: any[]) => row.join(','))
        ].join('\n');
        
        return res.send(csvContent);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${id}.json"`);
      return res.json(exportData);
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to export audit logs',
      });
    }
  }
}

export const appController = new AppController();