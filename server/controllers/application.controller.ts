import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { appService } from '../services/application.service';
import { fileService } from '../services/file.service';

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

      const stats = await appService.getOrganizationAppStats(organizationId);
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
}

export const appController = new AppController();